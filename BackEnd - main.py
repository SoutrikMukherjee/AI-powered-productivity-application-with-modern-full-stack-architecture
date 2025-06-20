from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, ForeignKey, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import openai
import os
from passlib.context import CryptContext
import jwt
from jwt import PyJWTError

# Initialize FastAPI app
app = FastAPI(title="AI Task Manager API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/taskmanager")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# OpenAI configuration
openai.api_key = os.getenv("OPENAI_API_KEY", "your-openai-key")

# Database Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    tasks = relationship("Task", back_populates="owner")
    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    priority = Column(Integer, default=0)
    estimated_hours = Column(Float)
    due_date = Column(DateTime)
    completed = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    project_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    estimated_hours: Optional[float] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: int
    estimated_hours: Optional[float]
    due_date: Optional[datetime]
    completed: bool
    project_id: Optional[int]
    created_at: datetime

class AIQueryRequest(BaseModel):
    query: str

class AIBreakdownRequest(BaseModel):
    goal: str

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# AI Helper Functions
def estimate_task_time(task_title: str, task_description: str = "") -> float:
    """Use AI to estimate task completion time"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a project management expert. Estimate the time needed for tasks in hours. Respond with only a number."},
                {"role": "user", "content": f"Task: {task_title}\nDescription: {task_description}\nEstimate hours needed:"}
            ],
            temperature=0.3,
            max_tokens=10
        )
        hours = float(response.choices[0].message.content.strip())
        return min(max(hours, 0.5), 40)  # Clamp between 0.5 and 40 hours
    except:
        return 2.0  # Default estimate

def prioritize_tasks(tasks: List[Task]) -> List[Task]:
    """Use AI to prioritize tasks based on multiple factors"""
    if not tasks:
        return []
    
    task_info = "\n".join([
        f"- {t.title} (Due: {t.due_date.strftime('%Y-%m-%d') if t.due_date else 'No due date'})"
        for t in tasks
    ])
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a productivity expert. Rank tasks by priority considering urgency, importance, and due dates. Return only task titles in order, one per line."},
                {"role": "user", "content": f"Prioritize these tasks:\n{task_info}"}
            ],
            temperature=0.3
        )
        
        prioritized_titles = response.choices[0].message.content.strip().split('\n')
        title_to_priority = {title.strip('- '): idx for idx, title in enumerate(prioritized_titles)}
        
        for task in tasks:
            task.priority = title_to_priority.get(task.title, 999)
        
        return sorted(tasks, key=lambda x: x.priority)
    except:
        return tasks

def breakdown_goal(goal: str) -> List[str]:
    """Use AI to break down a goal into actionable subtasks"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a project planning expert. Break down goals into 3-8 specific, actionable subtasks. Return only the subtasks, one per line."},
                {"role": "user", "content": f"Break down this goal into subtasks: {goal}"}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        subtasks = response.choices[0].message.content.strip().split('\n')
        return [task.strip('- ') for task in subtasks if task.strip()]
    except:
        return ["Unable to generate subtasks"]

# API Endpoints
@app.get("/")
async def root():
    return {"message": "AI Task Manager API", "version": "1.0.0"}

@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/projects", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_project = Project(**project.dict(), owner_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/projects", response_model=List[ProjectResponse])
async def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Project).filter(Project.owner_id == current_user.id).all()

@app.post("/tasks", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_task = Task(**task.dict(), owner_id=current_user.id)
    
    # AI-powered time estimation
    db_task.estimated_hours = estimate_task_time(db_task.title, db_task.description or "")
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Update priorities for all user tasks
    user_tasks = db.query(Task).filter(Task.owner_id == current_user.id, Task.completed == False).all()
    prioritized_tasks = prioritize_tasks(user_tasks)
    for task in prioritized_tasks:
        db.add(task)
    db.commit()
    
    return db_task

@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    completed: Optional[bool] = None,
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.owner_id == current_user.id)
    
    if completed is not None:
        query = query.filter(Task.completed == completed)
    if project_id is not None:
        query = query.filter(Task.project_id == project_id)
    
    return query.order_by(Task.priority).all()

@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task_update.dict(exclude_unset=True).items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.post("/ai/query")
async def ai_query(
    query: AIQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Natural language query interface"""
    user_tasks = db.query(Task).filter(Task.owner_id == current_user.id).all()
    
    # Prepare context for AI
    task_context = "\n".join([
        f"- {t.title} (Priority: {t.priority}, Due: {t.due_date}, Completed: {t.completed})"
        for t in user_tasks
    ])
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful task management assistant. Answer questions about the user's tasks and provide recommendations."},
                {"role": "user", "content": f"User tasks:\n{task_context}\n\nQuestion: {query.query}"}
            ],
            temperature=0.7
        )
        
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"response": "I couldn't process your query. Please try again."}

@app.post("/ai/breakdown")
async def ai_breakdown(
    request: AIBreakdownRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Break down a goal into subtasks"""
    subtasks = breakdown_goal(request.goal)
    
    # Create a new project for the goal
    project = Project(name=request.goal[:100], description=request.goal, owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Create tasks for each subtask
    created_tasks = []
    for idx, subtask in enumerate(subtasks):
        task = Task(
            title=subtask,
            owner_id=current_user.id,
            project_id=project.id,
            priority=idx
        )
        task.estimated_hours = estimate_task_time(subtask)
        db.add(task)
        created_tasks.append(task)
    
    db.commit()
    
    return {
        "project_id": project.id,
        "subtasks": [{"title": t.title, "estimated_hours": t.estimated_hours} for t in created_tasks]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

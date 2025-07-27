# TeamManager Setup Instructions

## 🚀 Quick Start

### 1. **Environment Setup**

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000

# Database Configuration
DBLINK=mongodb://localhost:27017/teammanager

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE_DATE=7d
```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Add Missing Dependencies**

```bash
npm install --save-dev nodemon @types/express-validator
```

### 4. **Start Development Server**

```bash
npm run start:dev
```

## 📋 **API Endpoints**

### Authentication

- `POST /api/v1/user/register` - Register new user
- `POST /api/v1/user/login` - Login user

### Teams

- `POST /api/v1/team/create` - Create new team (admin only)
- `GET /api/v1/team` - Get all teams
- `GET /api/v1/team/:id` - Get team by ID
- `PUT /api/v1/team/:id` - Update team (admin only)
- `DELETE /api/v1/team/:id` - Delete team (admin only)
- `POST /api/v1/team/add-member` - Add member to team (admin only)
- `POST /api/v1/team/remove-member` - Remove member from team (admin only)
- `GET /api/v1/team/admin/:adminId` - Get teams by admin
- `GET /api/v1/team/member/:memberId` - Get teams where user is member

### Projects

- `POST /api/v1/project/create` - Create new project (admin only)
- `GET /api/v1/project` - Get all projects
- `GET /api/v1/project/:id` - Get project by ID
- `PUT /api/v1/project/:id` - Update project (admin only)
- `DELETE /api/v1/project/:id` - Delete project (admin only)

### Tasks

- `POST /api/v1/task/create` - Create new task (admin only)
- `GET /api/v1/task` - Get all tasks
- `GET /api/v1/task/ptask` - Get project tasks
- `GET /api/v1/task/utask` - Get user tasks
- `PUT /api/v1/task/:id` - Update task (admin only)
- `DELETE /api/v1/task/:id` - Delete task (admin only)

## 🔧 **Team Management Workflow**

### 1. **Create Team**

```json
POST /api/v1/team/create
{
  "name": "Development Team",
  "description": "Team responsible for backend development",
  "adminId": "admin-user-id",
  "memberIds": ["member1-id", "member2-id"]
}
```

### 2. **Create Project**

```json
POST /api/v1/project/create
{
  "name": "E-commerce Platform",
  "duration": "3 months",
  "color": "#FF5733"
}
```

### 3. **Assign Task to Team Member**

```json
POST /api/v1/task/create
{
  "name": "Implement User Authentication",
  "duration": "2 weeks",
  "description": "Create JWT-based authentication system",
  "project": "project-id",
  "team": "team-id",
  "assignedTo": "member-username",
  "color": "#33FF57"
}
```

## 🛠️ **Required Fixes Before Running**

### 1. **Fix Task Validation Syntax**

In `src/Task/task.validation.ts`, fix parameter order:

```typescript
// Change from:
.custom(async ({ req }, val) => {

// To:
.custom(async (val, { req }) => {
```

### 2. **Fix Database Connection**

In `config.ts`, update the connection function:

```typescript
const Connection = async () => {
  try {
    await mongoose.connect(process.env.DBLINK!);
    console.log("Connected to database");
  } catch (e) {
    console.error("Database connection failed:", e);
    process.exit(1);
  }
};
```

### 3. **Fix HTTP Status Codes**

In `src/Task/task.services.ts`, fix the delete response:

```typescript
// Change from:
res.status(404).json({ message: "Task deleted successfully" });

// To:
res.status(200).json({ message: "Task deleted successfully" });
```

## 🔒 **Security Notes**

1. **JWT Secret**: Use a strong, random secret key
2. **Database**: Use strong passwords for production databases
3. **Environment Variables**: Never commit `.env` files to version control
4. **HTTPS**: Use HTTPS in production

## 📊 **Testing the API**

### 1. **Register Admin User**

```bash
curl -X POST http://localhost:3000/api/v1/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "confirmPassword": "admin123",
    "role": "admin"
  }'
```

### 2. **Login**

```bash
curl -X POST http://localhost:3000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. **Create Team (with token)**

```bash
curl -X POST http://localhost:3000/api/v1/team/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Team",
    "description": "A test team for development",
    "adminId": "ADMIN_USER_ID"
  }'
```

## 🚨 **Common Issues**

### 1. **Database Connection Failed**

- Ensure MongoDB is running
- Check the DBLINK in your `.env` file
- Verify network connectivity

### 2. **JWT Token Issues**

- Check JWT_SECRET_KEY is set
- Verify token expiration time
- Ensure proper Authorization header format

### 3. **Validation Errors**

- Check request body format
- Verify all required fields are present
- Ensure data types match expected format

## 📞 **Support**

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check the PROJECT_REPORT.md for detailed analysis

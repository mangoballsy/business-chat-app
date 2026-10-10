# Business Chat App - Full Architecture Blueprint

## Project Overview
A Discord-inspired communication platform for businesses to collaborate efficiently with real-time messaging, video calls, and role-based admin controls.

---

## Component Structure

### Pages (Top-level views)
```
src/pages/
├── Login.js              - Authentication page (email/password sign-in)
├── Dashboard.js          - Main workspace view
├── AdminPanel.js         - Admin settings and user management
└── NotFound.js           - 404 page
```

### Components (Reusable UI pieces)
```
src/components/
├── Sidebar/
│   ├── WorkspaceSidebar.js   - Left sidebar with channels and admin menu
│   ├── ChannelList.js         - Rendered channel list
│   └── AdminMenu.js           - Admin-only menu items
├── Chat/
│   ├── ChatWindow.js          - Main chat area
│   ├── MessageFeed.js         - Message list
│   ├── MessageItem.js         - Single message component
│   └── MessageComposer.js     - Input and send button
├── Header/
│   ├── TopBar.js              - Top navigation bar
│   ├── ChannelHeader.js       - Channel name and description
│   └── ActionButtons.js       - Video call, search, logout
├── Team/
│   ├── MemberPanel.js         - Right sidebar with online users
│   ├── MemberList.js          - List of team members
│   ├── StatusIndicator.js     - Online/busy/away dots
│   └── ProfileCard.js         - Current user profile
├── Admin/
│   ├── UserManagement.js      - List and manage users
│   ├── UserRow.js             - Single user with role selector
│   ├── RoleSelector.js        - Dropdown for changing roles
│   ├── ChannelManagement.js   - Create/delete channels
│   ├── PermissionSettings.js  - Configure channel permissions
│   └── WorkspaceSettings.js   - General workspace config
├── Modal/
│   ├── CreateChannelModal.js  - New channel dialog
│   ├── ConfirmDialog.js       - Confirmation for destructive actions
│   ├── RoleModal.js           - Change user role dialog
│   └── VideoCallModal.js      - Video call interface placeholder
├── Auth/
│   ├── LoginForm.js           - Email/password form
│   ├── SignUpForm.js          - New account creation
│   └── ProtectedRoute.js      - Route guard for authenticated users
└── Shared/
    ├── Button.js              - Reusable button
    ├── Input.js               - Reusable input field
    ├── Avatar.js              - User avatar
    └── Loading.js             - Loading spinner
```

### Hooks (Custom React logic)
```
src/hooks/
├── useAuth.js                - Auth state and login/logout
├── useChannels.js            - Fetch and manage channels
├── useMessages.js            - Fetch and send messages
├── useUsers.js               - Fetch and manage users
├── usePermissions.js         - Check user permissions
└── useFirestore.js           - Generic Firestore operations
```

### Services (Business logic)
```
src/services/
├── authService.js            - Sign in, sign out, register
├── channelService.js         - Create, delete, update channels
├── messageService.js         - Send, fetch, delete messages
├── userService.js            - Manage user profiles and roles
├── permissionService.js      - Check and enforce permissions
└── firestoreService.js       - Generic Firestore helpers
```

### Config
```
src/config/
├── roles.js                  - Role definitions and permissions
├── constants.js              - App-wide constants
└── firebaseConfig.js         - Firebase initialization
```

### Utilities
```
src/utils/
├── formatDate.js             - Date formatting helpers
├── validateEmail.js          - Email validation
├── generateId.js             - ID generation
└── errorHandler.js           - Error handling utilities
```

---

## Data Models (Firestore Collections)

### Users Collection
```
users/
├── {userId}
│   ├── email: string
│   ├── name: string
│   ├── role: "admin" | "manager" | "member" | "guest"
│   ├── status: "online" | "busy" | "away" | "offline"
│   ├── avatar: string (URL)
│   ├── createdAt: timestamp
│   └── workspaceId: string
```

### Channels Collection
```
channels/
├── {channelId}
│   ├── name: string
│   ├── description: string
│   ├── workspaceId: string
│   ├── createdBy: string (userId)
│   ├── isPrivate: boolean
│   ├── adminOnly: boolean
│   ├── members: array<string> (userIds)
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

### Messages Collection
```
messages/
├── {messageId}
│   ├── channelId: string
│   ├── senderId: string
│   ├── text: string
│   ├── timestamp: timestamp
│   ├── edited: boolean
│   ├── editedAt: timestamp (optional)
│   └── reactions: object (emoji -> count)
```

### Workspaces Collection
```
workspaces/
├── {workspaceId}
│   ├── name: string
│   ├── description: string
│   ├── ownerId: string
│   ├── logo: string (URL)
│   ├── createdAt: timestamp
│   ├── members: array<string> (userIds)
│   ├── settings: object
│   │   ├── allowPublicChannels: boolean
│   │   ├── requireApproval: boolean
│   │   └── maxChannels: number
│   └── updatedAt: timestamp
```

---

## User Roles & Permissions

### Admin
```javascript
{
  label: 'Admin',
  permissions: [
    'manage_users',           // Add/remove users
    'change_roles',           // Change user roles
    'create_channels',        // Create channels
    'delete_channels',        // Delete channels
    'manage_permissions',     // Set channel permissions
    'view_workspace_settings',
    'edit_workspace_settings',
    'start_video_calls',
    'send_messages',
    'join_channels'
  ]
}
```

### Manager
```javascript
{
  label: 'Manager',
  permissions: [
    'create_channels',
    'delete_channels',        // Own channels only
    'manage_permissions',     // Own channels only
    'moderate_messages',      // Delete/edit others' messages
    'start_video_calls',
    'send_messages',
    'join_channels'
  ]
}
```

### Member
```javascript
{
  label: 'Member',
  permissions: [
    'create_channels',        // Limited
    'send_messages',
    'join_channels',
    'start_video_calls',
    'edit_own_messages',      // Edit own messages only
    'delete_own_messages'     // Delete own messages only
  ]
}
```

### Guest
```javascript
{
  label: 'Guest',
  permissions: [
    'view_channels',
    'view_messages'
  ]
}
```

---

## Key Features

### 1. Authentication
- Email/password sign-in
- Sign-up with email
- Password reset
- Persistent login with Firebase session
- Role assignment on sign-up

### 2. Channels
- Create text channels (admin/manager only)
- Delete channels (admin only)
- Public vs. private channels
- Channel descriptions
- Member lists per channel
- Archive channels (future)

### 3. Messaging
- Real-time message updates (Firestore listeners)
- Send messages
- Edit own messages (members only)
- Delete messages (owner or admin)
- Message timestamps
- User avatars and roles displayed
- Typing indicators (future)

### 4. Admin Panel
- User management table
  - List all users
  - Change roles (dropdown)
  - Remove users
  - View user status
- Channel management
  - Create new channels
  - Delete channels
  - Set private/public
  - Configure permissions
- Workspace settings
  - Change workspace name
  - Toggle features
  - View audit log (future)

### 5. Video Calls
- Start video call button (placeholder for now)
- Video call modal with controls
- Participant list
- Screen share toggle (future)
- Recording toggle (future)

### 6. Team/Members Sidebar
- List online/offline users
- Status indicators
- Current user profile card
- Workspace switcher (future)

---

## User Flows

### Sign Up Flow
1. User lands on login page
2. Clicks "Create Workspace"
3. Enters email, password, workspace name
4. Firebase creates auth user
5. App creates user profile in Firestore
6. App creates default workspace
7. User redirected to dashboard
8. First user assigned "admin" role

### Sign In Flow
1. User enters email/password
2. Firebase authenticates
3. App loads user profile from Firestore
4. App checks permissions based on role
5. User redirected to dashboard

### Create Channel Flow (Admin/Manager)
1. User clicks "Create Channel" button
2. Modal opens with name, description, private/public toggle
3. User submits
4. App creates channel document in Firestore
5. Channel appears in sidebar for all members
6. Redirect to new channel

### Send Message Flow
1. User types in message input
2. User clicks send or presses Enter
3. App validates message
4. App creates message document in Firestore
5. Real-time listener updates message feed instantly
6. Message appears for all users in channel

### Change User Role Flow (Admin only)
1. Admin opens Admin Panel
2. Admin finds user in User Management
3. Admin clicks role dropdown
4. Admin selects new role
5. App updates user document in Firestore
6. User's permissions immediately change
7. User sees updated role in profile

---

## App Navigation

```
App (Root)
├── Login (if not authenticated)
│   ├── LoginForm
│   └── SignUpForm
└── Dashboard (if authenticated)
    ├── WorkspaceSidebar
    │   ├── ChannelList
    │   └── AdminMenu (admin only)
    ├── ChatWindow
    │   ├── ChannelHeader
    │   ├── MessageFeed
    │   └── MessageComposer
    ├── TopBar
    │   └── ActionButtons
    ├── MemberPanel
    │   └── MemberList
    └── AdminPanel (route: /admin, admin only)
        ├── UserManagement
        ├── ChannelManagement
        └── WorkspaceSettings
```

---

## File Tree Summary

```
business-chat-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Sidebar/
│   │   ├── Chat/
│   │   ├── Header/
│   │   ├── Team/
│   │   ├── Admin/
│   │   ├── Modal/
│   │   ├── Auth/
│   │   └── Shared/
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── AdminPanel.js
│   │   └── NotFound.js
│   ├── hooks/
│   ├── services/
│   ├── config/
│   ├── utils/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── firebase.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## Next Steps

1. Set up React app locally
2. Create Firebase project
3. Enable Firestore & Auth
4. Build Login page with Firebase auth
5. Build Dashboard layout
6. Build Admin Panel
7. Connect Firestore real-time listeners
8. Add video call placeholder
9. Deploy frontend to GitHub Pages
10. Deploy backend to Firebase


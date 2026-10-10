# business-chat-app
A Discord-inspired communication platform for businesses with real-time messaging, video calls, and admin controls


npx create-react-app business-chat-app
cd business-chat-app
npm install firebase

mkdir -p src/pages src/services src/config

cat > .env <<'EOF'
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
EOF

cat > src/firebase.js <<'EOF'
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
EOF

cat > src/config/roles.js <<'EOF'
export const roles = {
  admin: {
    label: 'Admin',
    permissions: [
      'manage_users',
      'change_roles',
      'create_channels',
      'delete_channels',
      'manage_permissions',
      'start_video_calls',
      'send_messages',
      'join_channels',
    ],
  },
  manager: {
    label: 'Manager',
    permissions: [
      'create_channels',
      'manage_permissions',
      'start_video_calls',
      'send_messages',
      'join_channels',
    ],
  },
  member: {
    label: 'Member',
    permissions: ['send_messages', 'join_channels', 'start_video_calls'],
  },
  guest: {
    label: 'Guest',
    permissions: ['view_channels'],
  },
};

export function hasPermission(userRole, permission) {
  return (roles[userRole]?.permissions || []).includes(permission);
}
EOF

cat > src/services/authService.js <<'EOF'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const registerUser = async ({ email, password, name }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    id: user.uid,
    email,
    name,
    role: 'member',
    status: 'online',
    createdAt: new Date(),
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserProfile = async (uid) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data();
  }

  return null;
};
EOF

cat > src/services/channelService.js <<'EOF'
import { db } from '../firebase';\nimport {\n  collection,\n  addDoc,\n  getDocs,\n  doc,\n  updateDoc,\n  deleteDoc,\n  onSnapshot,\n} from 'firebase/firestore';\n\nexport const createChannel = async ({ name, description, createdBy, isPrivate = false }) => {\n  try {\n    const channelRef = await addDoc(collection(db, 'channels'), {\n      name,\n      description,\n      createdBy,\n      isPrivate,\n      members: [createdBy],\n      createdAt: new Date(),\n      updatedAt: new Date(),\n    });\n    return channelRef.id;\n  } catch (error) {\n    console.error('Error creating channel:', error);\n    throw error;\n  }\n};\n\nexport const getChannels = async () => {\n  try {\n    const snapshot = await getDocs(collection(db, 'channels'));\n    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));\n  } catch (error) {\n    console.error('Error getting channels:', error);\n    throw error;\n  }\n};\n\nexport const subscribeToChannels = (callback) => {\n  return onSnapshot(collection(db, 'channels'), snapshot => {\n    const channels = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));\n    callback(channels);\n  });\n};\n\nexport const updateChannel = async (channelId, updates) => {\n  try {\n    await updateDoc(doc(db, 'channels', channelId), {\n      ...updates,\n      updatedAt: new Date(),\n    });\n  } catch (error) {\n    console.error('Error updating channel:', error);\n    throw error;\n  }\n};\n\nexport const deleteChannel = async (channelId) => {\n  try {\n    await deleteDoc(doc(db, 'channels', channelId));\n  } catch (error) {\n    console.error('Error deleting channel:', error);\n    throw error;\n  }\n};\nEOF

cat > src/services/messageService.js <<'EOF'
import { db } from '../firebase';\nimport {\n  collection,\n  addDoc,\n  query,\n  where,\n  orderBy,\n  onSnapshot,\n  getDocs,\n  doc,\n  updateDoc,\n  deleteDoc,\n} from 'firebase/firestore';\n\nexport const sendMessage = async ({ channelId, senderId, senderName, senderRole, text }) => {\n  try {\n    if (!text || !text.trim()) {\n      throw new Error('Message cannot be empty');\n    }\n\n    const ref = await addDoc(collection(db, 'messages'), {\n      channelId,\n      senderId,\n      senderName,\n      senderRole,\n      text: text.trim(),\n      timestamp: new Date(),\n      edited: false,\n    });\n\n    return ref.id;\n  } catch (error) {\n    console.error('Error sending message:', error);\n    throw error;\n  }\n};\n\nexport const subscribeToMessages = (channelId, callback) => {\n  const q = query(\n    collection(db, 'messages'),\n    where('channelId', '==', channelId),\n    orderBy('timestamp', 'asc')\n  );\n\n  return onSnapshot(q, snapshot => {\n    const messages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));\n    callback(messages);\n  });\n};\n\nexport const getMessages = async (channelId) => {\n  try {\n    const q = query(\n      collection(db, 'messages'),\n      where('channelId', '==', channelId),\n      orderBy('timestamp', 'asc')\n    );\n\n    const snapshot = await getDocs(q);\n    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));\n  } catch (error) {\n    console.error('Error fetching messages:', error);\n    throw error;\n  }\n};\n\nexport const editMessage = async (messageId, newText) => {\n  try {\n    await updateDoc(doc(db, 'messages', messageId), {\n      text: newText.trim(),\n      edited: true,\n      editedAt: new Date(),\n    });\n  } catch (error) {\n    console.error('Error editing message:', error);\n    throw error;\n  }\n};\n\nexport const deleteMessage = async (messageId) => {\n  try {\n    await deleteDoc(doc(db, 'messages', messageId));\n  } catch (error) {\n    console.error('Error deleting message:', error);\n    throw error;\n  }\n};\nEOF\n\ncat > src/services/permissionService.js <<'EOF'\nimport { roles } from '../config/roles';\n\nexport const hasPermission = (userRole, permission) => {\n  if (!userRole || !roles[userRole]) {\n    return false;\n  }\n\n  return (roles[userRole]?.permissions || []).includes(permission);\n};\n\nexport const canManageUsers = (userRole) => hasPermission(userRole, 'manage_users');\nexport const canChangeRoles = (userRole) => hasPermission(userRole, 'change_roles');\nexport const canCreateChannels = (userRole) => hasPermission(userRole, 'create_channels');\nexport const canDeleteChannels = (userRole) => hasPermission(userRole, 'delete_channels');\nexport const canSendMessages = (userRole) => hasPermission(userRole, 'send_messages');\nexport const canJoinChannels = (userRole) => hasPermission(userRole, 'join_channels');\nexport const canStartVideoCalls = (userRole) => hasPermission(userRole, 'start_video_calls');\nexport const canViewChannels = (userRole) =>\n  hasPermission(userRole, 'view_channels') || hasPermission(userRole, 'join_channels');\nEOF\n\ncat > src/pages/Login.js <<'EOF'\nimport React, { useState } from 'react';\nimport { loginUser, registerUser } from '../services/authService';\n\nfunction Login({ onLogin }) {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n  const [name, setName] = useState('');\n  const [isRegistering, setIsRegistering] = useState(false);\n\n  const handleSubmit = async (e) => {\n    e.preventDefault();\n\n    try {\n      if (isRegistering) {\n        const user = await registerUser({ email, password, name });\n        onLogin(user);\n      } else {\n        const user = await loginUser({ email, password });\n        onLogin(user);\n      }\n    } catch (error) {\n      alert(error.message);\n    }\n  };\n\n  return (\n    <div className=\"login-page\">\n      <div className=\"login-panel\">\n        <div className=\"brand\">\n          <div className=\"logo\">B</div>\n          <h1>Business Chat</h1>\n        </div>\n\n        <form onSubmit={handleSubmit} className=\"login-form\">\n          <h2>{isRegistering ? 'Create account' : 'Welcome back'}</h2>\n          <p>Manage your business workspace</p>\n\n          {isRegistering && (\n            <label>\n              Full name\n              <input\n                type=\"text\"\n                value={name}\n                onChange={(e) => setName(e.target.value)}\n                placeholder=\"Jane Smith\"\n              />\n            </label>\n          )}\n\n          <label>\n            Email\n            <input\n              type=\"email\"\n              value={email}\n              onChange={(e) => setEmail(e.target.value)}\n              placeholder=\"you@company.com\"\n            />\n          </label>\n\n          <label>\n            Password\n            <input\n              type=\"password\"\n              value={password}\n              onChange={(e) => setPassword(e.target.value)}\n              placeholder=\"••••••••\"\n            />\n          </label>\n\n          <button type=\"submit\" className=\"login-btn\">\n            {isRegistering ? 'Create account' : 'Sign In'}\n          </button>\n\n          <button\n            type=\"button\"\n            className=\"secondary-btn\"\n            onClick={() => setIsRegistering(!isRegistering)}\n          >\n            {isRegistering ? 'Back to login' : 'Create Workspace'}\n          </button>\n        </form>\n      </div>\n\n      <div className=\"promo-panel\">\n        <div className=\"promo-card\">\n          <span className=\"badge\">Business Communication</span>\n          <h3>Collaborate in real time</h3>\n          <ul>\n            <li>Team chats</li>\n            <li>Private channels</li>\n            <li>Admin controls</li>\n            <li>Video calls</li>\n          </ul>\n        </div>\n      </div>\n    </div>\n  );\n}\n\nexport default Login;\nEOF\n\ncat > src/pages/Dashboard.js <<'EOF'\nimport React, { useState } from 'react';\n\nconst initialChannels = [\n  { name: '# general', active: true },\n  { name: '# sales', active: false },\n  { name: '# support', active: false },\n  { name: '# design', active: false },\n  { name: '# engineering', active: false },\n];\n\nconst initialMessages = [\n  { user: 'Liam', role: 'Admin', text: 'Morning team — launch checklist is ready.', time: '9:15 AM' },\n  { user: 'Maya', role: 'Manager', text: 'QA passed the onboarding flow.', time: '9:18 AM' },\n  { user: 'You', role: 'Admin', text: 'Perfect — keep everyone updated here.', time: '9:22 AM' },\n];\n\nconst teammates = [\n  { name: 'Liam', status: 'online' },\n  { name: 'Maya', status: 'online' },\n  { name: 'Theo', status: 'busy' },\n  { name: 'Nina', status: 'online' },\n];\n\nfunction Dashboard({ user, onLogout }) {\n  const [channels] = useState(initialChannels);\n  const [messages] = useState(initialMessages);\n\n  return (\n    <div className=\"dashboard-shell\">\n      <aside className=\"workspace-sidebar\">\n        <div className=\"workspace-header\">\n          <div className=\"workspace-logo\">B</div>\n          <div>\n            <div className=\"workspace-name\">Business Hub</div>\n            <div className=\"workspace-subtitle\">Operations</div>\n          </div>\n        </div>\n\n        <div className=\"sidebar-section\">\n          <div className=\"section-title\">Channels</div>\n          <ul className=\"channel-list\">\n            {channels.map((channel) => (\n              <li key={channel.name} className={channel.active ? 'active' : ''}>\n                {channel.name}\n              </li>\n            ))}\n          </ul>\n        </div>\n\n        <div className=\"sidebar-section\">\n          <div className=\"section-title\">Admin</div>\n          <ul className=\"admin-list\">\n            <li>Permissions</li>\n            <li>Roles</li>\n            <li>Workspace Settings</li>\n          </ul>\n        </div>\n      </aside>\n\n      <main className=\"chat-panel\">\n        <header className=\"topbar\">\n          <div className=\"title-block\">\n            <div className=\"channel-pill\"># general</div>\n            <div className=\"channel-description\">Daily team updates</div>\n          </div>\n\n          <div className=\"topbar-actions\">\n            <button className=\"ghost-btn\">Search</button>\n            <button className=\"primary-btn\">Start Video Call</button>\n            <button className=\"logout-btn\" onClick={onLogout}>Log out</button>\n          </div>\n        </header>\n\n        <div className=\"chat-body\">\n          <div className=\"messages-panel\">\n            {messages.map((message, index) => (\n              <div key={index} className=\"message-row\">\n                <div className=\"avatar\">{message.user.charAt(0)}</div>\n                <div className=\"message-content\">\n                  <div className=\"message-meta\">\n                    <span className=\"user-name\">{message.user}</span>\n                    <span className=\"user-role\">{message.role}</span>\n                    <span className=\"time\">{message.time}</span>\n                  </div>\n                  <div className=\"message-text\">{message.text}</div>\n                </div>\n              </div>\n            ))}\n          </div>\n\n          <div className=\"composer-box\">\n            <input type=\"text\" placeholder=\"Message #general\" />\n            <button className=\"send-btn\">Send</button>\n          </div>\n        </div>\n      </main>\n\n      <aside className=\"member-panel\">\n        <div className=\"member-header\">Team Online</div>\n        <ul className=\"member-list\">\n          {teammates.map((person) => (\n            <li key={person.name}>\n              <span className=\"member-name\">{person.name}</span>\n              <span className={`status-dot ${person.status}`}></span>\n            </li>\n          ))}\n        </ul>\n\n        <div className=\"profile-card\">\n          <div className=\"profile-avatar\">{user?.name?.charAt(0) || 'A'}</div>\n          <div>\n            <div className=\"profile-name\">{user?.name || 'Admin User'}</div>\n            <div className=\"profile-role\">{user?.role || 'Admin'}</div>\n          </div>\n        </div>\n      </aside>\n    </div>\n  );\n}\n\nexport default Dashboard;\nEOF\n\ncat > src/App.js <<'EOF'\nimport React, { useEffect, useState } from 'react';\nimport { onAuthStateChanged } from 'firebase/auth';\nimport { doc, getDoc } from 'firebase/firestore';\nimport { auth, db } from './firebase';\nimport Login from './pages/Login';\nimport Dashboard from './pages/Dashboard';\nimport './App.css';\n\nfunction App() {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {\n      if (firebaseUser) {\n        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));\n\n        if (userDoc.exists()) {\n          setUser({ ...userDoc.data(), uid: firebaseUser.uid });\n        } else {\n          setUser({\n            id: firebaseUser.uid,\n            email: firebaseUser.email,\n            name: firebaseUser.email.split('@')[0],\n            role: 'member',\n          });\n        }\n      } else {\n        setUser(null);\n      }\n\n      setLoading(false);\n    });\n\n    return () => unsubscribe();\n  }, []);\n\n  const handleLogin = (firebaseUser) => {\n    setUser(firebaseUser);\n  };\n\n  const handleLogout = () => {\n    setUser(null);\n  };\n\n  if (loading) {\n    return <div className=\"loading-screen\">Loading...</div>;\n  }\n\n  return (\n    <div className=\"App\">\n      {user ? <Dashboard user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />}\n    </div>\n  );\n}\n\nexport default App;\nEOF\n\ncat > src/App.css <<'EOF'\n* {\n  box-sizing: border-box;\n}\n\nhtml, body, #root {\n  margin: 0;\n  min-height: 100%;\n  height: 100%;\n}\n\nbody {\n  margin: 0;\n  font-family: Arial, sans-serif;\n  background: #1f2330;\n  color: #fff;\n}\n\nbutton, input {\n  font: inherit;\n}\n\n.loading-screen {\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #1f2330;\n  color: white;\n}\n\n.App {\n  min-height: 100vh;\n}\n\n.login-page {\n  min-height: 100vh;\n  display: flex;\n  background: linear-gradient(135deg, #1f2330, #2b2f3a);\n}\n\n.login-panel {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  padding: 40px;\n}\n\n.brand {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  margin-bottom: 30px;\n  width: 100%;\n  max-width: 420px;\n}\n\n.logo, .workspace-logo, .profile-avatar, .avatar {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 700;\n}\n\n.logo, .workspace-logo {\n  width: 42px;\n  height: 42px;\n  border-radius: 12px;\n  background: linear-gradient(135deg, #5865f2, #7c5cff);\n}\n\n.login-form {\n  width: 100%;\n  max-width: 420px;\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 18px;\n  padding: 30px;\n  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);\n}\n\n.login-form h2 {\n  margin: 0 0 10px;\n  font-size: 2rem;\n}\n\n.login-form p {\n  margin: 0 0 20px;\n  color: #b9bfd1;\n}\n\n.login-form label {\n  display: block;\n  margin-bottom: 18px;\n  color: #dfe5f4;\n  font-size: 0.92rem;\n}\n\n.login-form input {\n  width: 100%;\n  margin-top: 8px;\n  padding: 14px 16px;\n  border-radius: 10px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  background: #2d3342;\n  color: white;\n  outline: none;\n}\n\n.login-form input:focus {\n  border-color: #7c5cff;\n  box-shadow: 0 0 0 2px rgba(124, 92, 255, 0.25);\n}\n\n.login-btn,\n.secondary-btn,\n.primary-btn,\n.ghost-btn,\n.logout-btn,\n.send-btn {\n  border: none;\n  border-radius: 10px;\n  padding: 12px 16px;\n  cursor: pointer;\n  font-weight: 600;\n  transition: 0.2s ease;\n}\n\n.login-btn,\n.primary-btn {\n  background: linear-gradient(135deg, #5865f2, #4752c4);\n  color: white;\n}\n\n.secondary-btn,\n.ghost-btn,\n.logout-btn {\n  background: #2d3342;\n  color: #fff;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n}\n\n.promo-panel {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 40px;\n  background: radial-gradient(circle at top left, #3a426a, #171b28 55%);\n}\n\n.promo-card {\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 20px;\n  padding: 30px;\n  max-width: 420px;\n  width: 100%;\n  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);\n}\n\n.badge {\n  display: inline-block;\n  margin-bottom: 20px;\n  background: rgba(88, 101, 242, 0.18);\n  color: #b3bbff;\n  padding: 8px 12px;\n  border-radius: 999px;\n  font-size: 0.8rem;\n}\n\n.promo-card h3 {\n  font-size: 2.2rem;\n  margin: 0 0 20px;\n}\n\n.promo-card ul {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  display: grid;\n  gap: 12px;\n  color: #dfe5f4;\n}\n\n.promo-card li::before {\n  content: \"• \";\n  color: #7c5cff;\n}\n\n.dashboard-shell {\n  display: grid;\n  grid-template-columns: 260px minmax(0, 1fr) 280px;\n  min-height: 100vh;\n  background: #1a1d25;\n}\n\n.workspace-sidebar,\n.member-panel {\n  background: #20242d;\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n  padding: 20px 16px;\n}\n\n.member-panel {\n  border-right: none;\n  border-left: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.workspace-header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding-bottom: 18px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  margin-bottom: 20px;\n}\n\n.workspace-name {\n  font-weight: 700;\n}\n\n.workspace-subtitle {\n  color: #9aa5bb;\n  font-size: 0.8rem;\n}\n\n.sidebar-section {\n  margin-bottom: 26px;\n}\n\n.section-title,\n.member-header {\n  color: #9aa5bb;\n  text-transform: uppercase;\n  font-size: 0.72rem;\n  letter-spacing: 0.08em;\n  margin-bottom: 14px;\n}\n\n.channel-list,\n.admin-list,\n.member-list {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n  display: grid;\n  gap: 10px;\n}\n\n.channel-list li,\n.admin-list li,\n.member-list li {\n  padding: 10px 12px;\n  border-radius: 10px;\n  color: #dfe5f4;\n}\n\n.channel-list li.active {\n  background: rgba(88, 101, 242, 0.18);\n  color: white;\n}\n\n.chat-panel {\n  display: flex;\n  flex-direction: column;\n  background: #1d2129;\n}\n\n.topbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 18px 22px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.title-block {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n}\n\n.channel-pill {\n  background: rgba(88, 101, 242, 0.18);\n  color: #bfd0ff;\n  padding: 8px 12px;\n  border-radius: 999px;\n  font-weight: 700;\n}\n\n.channel-description {\n  color: #a4afc4;\n}\n\n.topbar-actions {\n  display: flex;\n  gap: 10px;\n  align-items: center;\n}\n\n.chat-body {\n  display: flex;\n  flex-direction: column;\n  flex: 1;\n  padding: 18px 18px 0;\n}\n\n.messages-panel {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 18px;\n  padding-right: 8px;\n}\n\n.message-row {\n  display: flex;\n  gap: 12px;\n  align-items: flex-start;\n}\n\n.avatar {\n  width: 36px;\n  height: 36px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #5865f2, #7c5cff);\n  font-size: 0.9rem;\n}\n\n.message-content {\n  flex: 1;\n  background: rgba(255, 255, 255, 0.02);\n  border: 1px solid rgba(255, 255, 255, 0.04);\n  border-radius: 12px;\n  padding: 12px 14px;\n}\n\n.message-meta {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-bottom: 6px;\n}\n\n.user-name {\n  font-weight: 700;\n}\n\n.user-role,\n.time {\n  color: #9aa5bb;\n  font-size: 0.78rem;\n}\n\n.message-text {\n  color: #ebedf2;\n  line-height: 1.5;\n}\n\n.composer-box {\n  display: flex;\n  gap: 10px;\n  padding: 18px 0 22px;\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n  margin-top: 18px;\n}\n\n.composer-box input {\n  flex: 1;\n  background: #2b303b;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  padding: 14px 16px;\n  border-radius: 12px;\n  color: white;\n  outline: none;\n}\n\n.send-btn {\n  background: linear-gradient(135deg, #5865f2, #4752c4);\n  color: white;\n}\n\n.member-list li {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n.status-dot {\n  width: 10px;\n  height: 10px;\n  border-radius: 50%;\n  display: inline-block;\n}\n\n.status-dot.online {\n  background: #4ade80;\n}\n\n.status-dot.busy {\n  background: #fbbf24;\n}\n\n.status-dot.away {\n  background: #f87171;\n}\n\n.profile-card {\n  background: rgba(255, 255, 255, 0.03);\n  border: 1px solid rgba(255, 255, 255, 0.05);\n  border-radius: 14px;\n  padding: 16px;\n  margin-top: 20px;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n\n.profile-avatar {\n  width: 42px;\n  height: 42px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #5865f2, #7c5cff);\n}\n\n.profile-name {\n  font-weight: 700;\n}\n\n.profile-role {\n  color: #9aa5bb;\n  font-size: 0.8rem;\n}\n\n@media (max-width: 980px) {\n  .dashboard-shell {\n    grid-template-columns: 1fr;\n  }\n\n  .login-page {\n    flex-direction: column;\n  }\n\n  .promo-panel {\n    display: none;\n  }\n}\nEOF\n\ncat > src/index.js <<'EOF'\nimport React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\nEOF\n\nnpm start\n```

If you want, I can follow this with:
- the exact `AdminPanel.js` file
- the Firestore database setup steps
- the role-based permission checks in the dashboard
- the final step to connect it to Firebase Auth and Firestore live updates

I can keep going in exact copy/paste form for the next phase.
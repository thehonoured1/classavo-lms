import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlateEditor } from "@/components/plate-editor";

// --- PAGE 1: THE COURSE LIST ---
function CourseList({ token }) { 
  const [courses, setCourses] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/courses/')
      .then(response => response.json())
      .then(data => setCourses(data));
  }, []);

  // --- NEW: The Join Course Action ---
  const handleJoinCourse = (courseId) => {
    if (!token) {
      setStatusMsg("You must be logged in to join a course.");
      return;
    }

    // Notice the new '/join/' endpoint we built in Django!
    fetch(`http://127.0.0.1:8000/api/courses/${courseId}/join/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // THIS IS THE BOUNCER CHECK! We flash our JWT wristband here:
        'Authorization': `Bearer ${token}` 
      }
    })
    .then(response => response.json())
    .then(data => {
      setStatusMsg(data.detail); // This prints "Successfully joined!" or "Already enrolled."
    });
  };

  return (
    <div>
      <h1>Classavo LMS - Course Catalog</h1>
      
      {/* 1. THE STATUS MESSAGE: Shows success/error messages at the top */}
      {statusMsg && (
        <div style={{ padding: '10px', backgroundColor: '#e2f3f5', marginBottom: '15px', borderLeft: '4px solid #007BFF' }}>
          {statusMsg}
        </div>
      )}

      {courses.map(course => (
        <div key={course.id} style={{ border: '1px solid gray', margin: '10px', padding: '10px' }}>
          <h2>{course.title}</h2>
          
          {/* 2. THE JOIN BUTTON: Placed right below the course title! */}
          <button 
            onClick={() => handleJoinCourse(course.id)}
            style={{ 
              marginBottom: '15px', 
              padding: '6px 12px', 
              cursor: 'pointer', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            + Join Course
          </button>

          <ul>
            {course.chapters && course.chapters.map(chapter => (
              <li key={chapter.id}>
                {/* We use <Link> instead of an <a> tag so the page doesn't reload! */}
                <Link to={`/chapter/${chapter.id}`}>
                  {chapter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
} // <-- ADDED MISSING BRACE HERE

// --- HELPER: THE JSON TO HTML TRANSLATOR (UPGRADED) ---
function renderRichText(blocks) {
  // 1. Safety Net: Ensure 'blocks' is actually an array before we try to map it!
  if (!Array.isArray(blocks)) {
    console.error("Expected an array, but got:", blocks);
    return <p>Error: Invalid content format.</p>;
  }

  // 2. If it's an empty array, show nothing
  if (blocks.length === 0) return null;

  return blocks.map((block, index) => {
    // 3. Safety Net: Ensure the block actually has a 'children' array
    if (!block.children || !Array.isArray(block.children)) {
      return null; // Skip this broken block
    }

    // 4. Safety Net: Extract text safely using the '?' optional chaining operator
    // This says "If children[0] exists, get the text. Otherwise, use a blank string."
    const textContent = block.children[0]?.text || '';

    switch (block.type) {
      case 'h1':
        return <h1 key={index} style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '10px' }}>{textContent}</h1>;
      case 'p':
        return <p key={index} style={{ lineHeight: '1.6', fontSize: '18px' }}>{textContent}</p>;
      default:
        return <p key={index}>{textContent}</p>;
    }
  });
}
// This function safely checks if the text is JSON. Preparation for PAGE 2.
// If it fails, it automatically converts the old plain text into a Plate-readable JSON array!
const parseLessonContent = (rawContent) => {
  if (!rawContent) return [];
  
  try {
    const parsed = JSON.parse(rawContent);
    if (Array.isArray(parsed)) {
      return parsed; // It's a new Plate JSON lesson!
    }
  } catch (e) {
    // It failed to parse, which means it's an old plain-text lesson.
  }

  // Convert the old plain text into Plate's official format
  return [
    {
      type: "p",
      children: [{ text: rawContent }],
    },
  ];
};
// --- PAGE 2: THE CHAPTER READING VIEW ---
function ChapterView({ token }) {
  const { id } = useParams();
  const [chapter, setChapter] = useState(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    // We MUST pass the token so Django knows exactly who is reading the lesson!
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(`http://127.0.0.1:8000/api/chapters/${id}/`, { headers })
      .then(response => {
        if (!response.ok) throw new Error("Backend error. Check the Django terminal!");
        return response.json();
      })
      .then(data => setChapter(data))
      .catch(err => setFetchError(err.message));
  }, [id, token]);

  if (fetchError) return <div style={{ padding: '20px', color: 'red' }}>Error: {fetchError}</div>;
  if (!chapter) return <div style={{ padding: '20px' }}>Loading lesson...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/">&larr; Back to Courses</Link>
      
      {/* --- THE NEW SMART VIEWER --- */}
      <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
        
        {/* 1. Wait for the database to finish loading */}
        {!chapter.content ? (
          <p>Loading lesson...</p>
        ) : (
          
          /* 2. The 'key' forces the editor to reboot when the data is ready */
          <div key={chapter.id}>
            <PlateEditor 
              initialValue={parseLessonContent(chapter.content)} 
              readOnly={true}
            />
          </div>

        )}

      </div>
      
      {/* Notice the button is gone! Django marks it as read automatically in the background now. */}
    </div>
  );
}
// --- PAGE 3: THE INSTRUCTOR DASHBOARD ---
function InstructorDashboard({ token }) {
  // 1. Core Data States
  const [courses, setCourses] = useState([]); 

  // 2. Course Creation States
  const [courseTitle, setCourseTitle] = useState('');
  const [courseIsPublic, setCourseIsPublic] = useState(true);
  const [courseStatus, setCourseStatus] = useState('');

  // 3. Chapter Creation States
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState([{ type: 'p', children: [{ text: '' }] }]);
  const [blockType, setBlockType] = useState('p'); 
  const [chapterStatus, setChapterStatus] = useState('');
  const editor = usePlateEditor({
    value: chapterContent
  });

  // 4. Course Modification States
  const [editCourseId, setEditCourseId] = useState('');
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseIsPublic, setEditCourseIsPublic] = useState(true);
  const [editCourseStatus, setEditCourseStatus] = useState('');

  // 5. --- NEW: Course Deletion States ---
  const [deleteCourseId, setDeleteCourseId] = useState('');
  const [deleteCourseStatus, setDeleteCourseStatus] = useState('');

  const fetchCourses = () => {
    // --- NEW: Attach the token to the GET request! ---
    fetch('http://127.0.0.1:8000/api/courses/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        if (data.length > 0) {
          if (!selectedCourseId) setSelectedCourseId(data[0].id);
          if (!editCourseId) setEditCourseId(data[0].id);
          if (!deleteCourseId) setDeleteCourseId(data[0].id); 
        }
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const courseToEdit = courses.find(c => c.id.toString() === editCourseId.toString());
    if (courseToEdit) {
      setEditCourseTitle(courseToEdit.title);
      setEditCourseIsPublic(courseToEdit.is_public !== false);  
    }
  }, [editCourseId, courses]);

  // Handle Course Creation
  const handleCreateCourse = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:8000/api/courses/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: courseTitle, is_public: courseIsPublic })
    }).then(res => {
      if (res.ok) {
        setCourseStatus(`Success! "${courseTitle}" created.`);
        setCourseTitle('');
        fetchCourses(); 
      }
    });
  };

  // Handle Course Modification
  const handleUpdateCourse = (e) => {
    e.preventDefault();
    fetch(`http://127.0.0.1:8000/api/courses/${editCourseId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: editCourseTitle, is_public: editCourseIsPublic})
    }).then(res => {
      if (res.ok) {
        setEditCourseStatus(`Success! Course renamed to "${editCourseTitle}".`);
        fetchCourses(); 
      } else {
        return res.json().then(err => setEditCourseStatus(`Error: ${JSON.stringify(err)}`));
      }
    }).catch(err => setEditCourseStatus(`Network Error: ${err.message}`));
  };

  // --- NEW: Handle Course Deletion ---
  const handleDeleteCourse = (e) => {
    e.preventDefault();
    
    // Safety Net: Ask the user to confirm before proceeding!
    const isConfirmed = window.confirm("Are you sure you want to delete this course? This will also delete all lessons inside it. This cannot be undone.");
    if (!isConfirmed) return; // If they click cancel, stop the function here.

    fetch(`http://127.0.0.1:8000/api/courses/${deleteCourseId}/`, {
      method: 'DELETE', // The magic DRF deletion method
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    }).then(res => {
      // DELETE requests usually return a 204 No Content status when successful
      if (res.ok) {
        setDeleteCourseStatus("Success! Course deleted.");
        fetchCourses(); // Refresh the list so the deleted course disappears!
      } else {
        setDeleteCourseStatus("Error deleting course.");
      }
    }).catch(err => setDeleteCourseStatus(`Network Error: ${err.message}`));
  };

  // Handle Chapter Creation
  const handleCreateChapter = (e) => {
    e.preventDefault();
    const formattedContent = [{ type: blockType, children: [{ text: chapterContent }] }];
    fetch('http://127.0.0.1:8000/api/chapters/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: chapterTitle, visibility: true, course: selectedCourseId, content: chapterContent })
    }).then(res => {
      if (res.ok) {
        setChapterStatus(`Success! Lesson created.`);
        setChapterTitle('');
        setChapterContent('');
      } else {
        setChapterStatus(`Error creating lesson.`);
      }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <Link to="/">&larr; Back to Student View</Link>
      <h2>Instructor Dashboard</h2>
      
      {/* 1. COURSE BUILDER */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
        <h3>1. Create a New Course</h3>
        <form onSubmit={handleCreateCourse}>
          <input type="text" placeholder="Course Title" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required style={{ padding: '8px', width: '60%', marginRight: '10px' }} />
          <label style={{ display: 'block', margin: '10px 0' }}>
            <input type="checkbox" checked={courseIsPublic} onChange={(e) => setCourseIsPublic(e.target.checked)} />
            {' '}Make this course Public
          </label>
          <button type="submit" style={{ padding: '8px 16px' }}>Create</button>
        </form>
        {courseStatus && <p style={{ color: 'green', marginTop: '10px' }}>{courseStatus}</p>}
      </div>

      {/* 2. COURSE MODIFIER */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
        <h3>2. Rename an Existing Course</h3>
        <form onSubmit={handleUpdateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select value={editCourseId} onChange={(e) => setEditCourseId(e.target.value)} style={{ padding: '8px' }}>
            {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
          <input type="text" value={editCourseTitle} onChange={(e) => setEditCourseTitle(e.target.value)} required style={{ padding: '8px' }} />
          <label style={{ margin: '10px 0' }}>
            <input type="checkbox" checked={editCourseIsPublic} onChange={(e) => setEditCourseIsPublic(e.target.checked)} />
            {' '}Course is Public
          </label>
          <button type="submit" style={{ padding: '10px', backgroundColor: '#FF8C00', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Update Name</button>
        </form>
        {editCourseStatus && <p style={{ color: 'green', marginTop: '10px' }}>{editCourseStatus}</p>}
      </div>

     {/* 3. CHAPTER BUILDER */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
        <h3>3. Add a Lesson to a Course</h3>
        <form onSubmit={handleCreateChapter} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={{ padding: '8px' }}>
            {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
          <input type="text" placeholder="Lesson Title" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} required style={{ padding: '8px' }} />
          
          <label>Lesson Content:</label>
          {/* --- THE SHINY NEW EDITOR --- */}
          <div style={{ border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
            <PlateEditor 
              initialValue={chapterContent}
              onChange={(newValue) => setChapterContent(newValue)}
            />
          </div>

          <button type="submit" style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Publish Lesson</button>
        </form>
        {chapterStatus && <p style={{ color: 'green', marginTop: '10px' }}>{chapterStatus}</p>}
      </div>
      {/* --- 4. THE DANGER ZONE (COURSE DELETION) --- */}
      <div style={{ border: '1px solid #ffcccc', padding: '20px', marginTop: '20px', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
        <h3 style={{ color: '#d9534f', marginTop: 0 }}>4. Danger Zone</h3>
        <form onSubmit={handleDeleteCourse} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ color: '#d9534f', fontWeight: 'bold' }}>Select Course to Delete:</label>
          <select 
            value={deleteCourseId} 
            onChange={(e) => setDeleteCourseId(e.target.value)}
            style={{ padding: '8px', borderColor: '#ffcccc' }}
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>

          <button type="submit" style={{ padding: '10px', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Permanently Delete Course
          </button>
        </form>
        {deleteCourseStatus && <p style={{ color: deleteCourseStatus.includes('Error') ? 'red' : 'green', marginTop: '10px' }}>{deleteCourseStatus}</p>}
      </div>
      
    </div>
  );
} 
// --- PAGE 4: THE LOGIN PAGE ---
function Login({ setToken, setUserRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate(); // <-- 1. Initialize the navigator!

  const handleLogin = (e) => {
    e.preventDefault();
    
    fetch('http://127.0.0.1:8000/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => {
      if (!res.ok) throw new Error('Invalid credentials');
      return res.json();
    })
    .then(data => {
      localStorage.setItem('access_token', data.access);
      setToken(data.access);
      
      return fetch('http://127.0.0.1:8000/api/me/', {
        headers: { 'Authorization': `Bearer ${data.access}` }
      });
    })
    .then(res => res.json())
    .then(userData => {
      setUserRole(userData.is_instructor ? 'instructor' : 'student');
      navigate('/'); // <-- 2. The Magic Redirect! Send them to the Student Catalog.
    })
    .catch(err => setError(err.message));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Log In to Classavo</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" placeholder="Username" value={username} 
          onChange={e => setUsername(e.target.value)} required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" placeholder="Password" value={password} 
          onChange={e => setPassword(e.target.value)} required 
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none' }}>
          Log In
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
// --- THE MASTER SWITCHBOARD ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [userRole, setUserRole] = useState(null); // 'instructor' or 'student'

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUserRole(null); // Clear the role on logout!
  };

  return (
    <TooltipProvider>
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <nav style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Link to="/" style={{ marginRight: '15px' }}>Student Catalog</Link>
          
          {/* ONLY show this link if the user is an instructor! */}
          {userRole === 'instructor' && (
            <Link to="/instructor" style={{ color: '#d9534f' }}>Instructor Dashboard</Link>
          )}
        </div>
        
        <div>
          {token ? (
            <button onClick={handleLogout} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#555', textDecoration: 'underline' }}>Log Out</button>
          ) : (
            <Link to="/login">Log In</Link>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<CourseList token={token} />} />
        <Route path="/chapter/:id" element={<ChapterView token={token} />} />
        {/* Protect the actual route so students can't type /instructor in the URL bar */}
        <Route path="/instructor" element={userRole === 'instructor' ? <InstructorDashboard token={token} /> : <div>Unauthorized</div>} />
        <Route path="/login" element={<Login setToken={setToken} setUserRole={setUserRole} />} />
      </Routes>
    </div>
    </TooltipProvider>
  );
}
export default App;
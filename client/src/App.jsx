import axios from "axios";
import Register from "./components/Register"
import Routes from "./Routes";
import { UserContextProvider } from "./UserContext";
function App() {
  
  axios.defaults.baseURL = 'http://localhost:8800';
  axios.defaults.withCredentials = true;

  return (
      <UserContextProvider>
        <Routes />
      </UserContextProvider>
  )
}

export default App

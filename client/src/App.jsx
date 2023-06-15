import axios from "axios";
import Register from "./components/Register"
import Routes from "./Routes";
import { UserContextProvider } from "./UserContext";
function App() {
  
  axios.defaults.baseURL = 'https://chatter-v1.vercel.app';
  axios.defaults.withCredentials = true;

  return (
      <UserContextProvider>
        <Routes />
      </UserContextProvider>
  )
}

export default App

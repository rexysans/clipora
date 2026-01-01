import { createBrowserRouter } from "react-router-dom";

import Home from "../pages/Home/Home";
import Watch from "../pages/Watch/Watch";
import Upload from "../pages/Upload/Upload";
import NotFound from "../pages/NotFound/NotFound";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/watch/:videoId",
    element: <Watch />,
  },
  {
    path: "/upload",
    element: <Upload />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
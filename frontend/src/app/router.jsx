import { createBrowserRouter } from "react-router-dom";

import Home from "../pages/Home/Home";
import Watch from "../pages/Watch/Watch";
import Upload from "../pages/Upload/Upload";
import NotFound from "../pages/NotFound/NotFound";

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
    path: "*",
    element: <NotFound />,
  },
]);

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import {createBrowserRouter, RouterProvider} from "react-router-dom"

//List pages here & add to router
import IA from './Pages/Ia'
import YT from './Pages/Yt'

const router = createBrowserRouter([
  {
    path: "/",
    element: <IA />,
    index: true
  },
  {
    path: "/ia",
    element: <IA />
  },
  {
    path: "/yt",
    element: <YT />
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

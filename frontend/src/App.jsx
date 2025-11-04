import { memo } from 'react';
import Sidebar from './bilesenler/Sidebar/Sidebar';
import Main from './bilesenler/main/main';
/*
import Signup from "./bilesenler/Signup/Signup"; <Signup />;
 */

const App = () => {
  return (
    <>
      <Main/>
    </>
  );
};

export default memo(App);
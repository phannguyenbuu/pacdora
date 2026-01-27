import React, { Suspense, lazy } from "react";
import "./HomePage.scss";

const WorkspaceConfig = lazy(() =>
  import("../../Experience/components/WorkspaceConfig")
);

const HomePage = () => {
  console.log("[boot] HomePage render");
  return (
    <Suspense fallback={<div className="page-loading">Loading workspace...</div>}>
      <WorkspaceConfig />
    </Suspense>
  );
};

export default HomePage;

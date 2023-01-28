import { Fragment, ReactElement } from "react";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";

import hero from "./images/emerald highway.jpg";

export default function App(): ReactElement {
  return (
    <Fragment>
      <CssBaseline />
      <Container>
        <img
          src={hero}
          alt="Two dogs overlook the forest from the Emerald Highway"
        />
      </Container>
    </Fragment>
  );
}

import { ReactElement } from "react";

import Container from "@mui/material/Container";
import src from "../images/emerald highway.jpg";

export default function Home(): ReactElement {
  return (
    <Container>
      <img
        src={src}
        alt="Two dogs overlook the forest from the Emerald Highway"
      />
    </Container>
  );
}

import { ReactElement } from "react";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function Home(): ReactElement {
  return (
    <Container>
      <Typography>
        We moved to Mendocino (town and county) and promptly adopted two wonderful, active dogs.
        With such energetic animals, we find ourselves constantly hiking and exploring this amazing area.
        This site is attempt to share some of our favorite places so that more people can enjoy them.
      </Typography>
    </Container>
  );
}

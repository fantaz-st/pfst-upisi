import Grid from "@mui/material/Grid";
import IntakeCard from "./IntakeCard";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function IntakeCards({ intakes }) {
  if (!intakes || intakes.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Trenutno nema dostupnih vrsta upisa.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3} sx={{ marginTop: "3rem" }}>
      {intakes.map((intake) => (
        <Grid key={intake.id} size={{ xs: 12, sm: 6, md: 6 }}>
          <IntakeCard intake={intake} />
        </Grid>
      ))}
    </Grid>
  );
}

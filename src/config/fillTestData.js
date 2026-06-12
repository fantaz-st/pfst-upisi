const fillTestData = () => {
  // Osobni podaci
  setValue("first_name", "Čedomir");
  setValue("last_name", "Babić");
  setValue("email", "cbabic.st@gmail.com");
  setValue("phone", "++385997973959");
  setValue("oib", "71233233747");
  setValue("birth_date", "1988-06-02");
  setValue("birth_place", "Split");
  setValue("gender", "muški");
  setValue("marital_status", "Oženjen / Udana");
  setValue("citizenship", "Hrvatsko");
  setValue("address", "Vinkovačka 45");
  setValue("city", "Split");
  setValue("postal_code", "21000");
  // Studij
  setValue("program", studyPrograms[intake.study_level]?.[0]?.value || "bs");
  setValue("study_type", "redoviti");
  // Roditelji
  setValue("father_name", "Nikola");
  setValue("father_occupation", "Vozač");
  setValue("father_address", "Vinkovačka 45, Split");
  setValue("mother_name", "Dragica");
  setValue("mother_occupation", "Upravni referent");
  setValue("mother_address", "Vinkovačka 45, Split");
  // Obrazovanje
  setValue("previous_institution", "Elektrotehnička škola Split");
  setValue("previous_program", "Tehničar za računalstvo");
  setValue("previous_completion_year", "2005");
  setValue("other_education", "");
  setValue("ranking_score", "1");
  setValue("enrollment_type", 1);
  setValue("consent", true);
};

export default fillTestData;

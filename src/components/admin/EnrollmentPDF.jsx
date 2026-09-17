import React from "react";
import { Document, Page, Text, View, StyleSheet, Image as PDFImage, Font } from "@react-pdf/renderer";
import { join } from "path";
import { enrollmentTypeOptions } from "@/lib/applications/config";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Roboto", backgroundColor: "#FFFFFF" },
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#0f385c",
    borderBottomStyle: "solid",
  },
  facultyName: { fontSize: 10, color: "#666666", marginBottom: 8, textAlign: "center" },
  documentTitle: { fontSize: 18, fontWeight: 700, color: "#058cc4", letterSpacing: 0.8, textAlign: "center" },

  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#0f385c",
    marginBottom: 7,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  photoBox: {
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "solid",
    borderRadius: 4,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#f8fafc",
  },
  photo: { width: 90, height: 90, objectFit: "cover" },
  photoPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: { fontSize: 7, color: "#94a3b8", textAlign: "center" },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
    borderBottomStyle: "solid",
  },
  dataLabel: { width: "38%", fontSize: 8, color: "#64748b" },
  dataValue: { width: "62%", fontSize: 9, color: "#0f172a" },
  dataValueBold: { fontWeight: 700 },
  twoCol: { flexDirection: "row", gap: 16 },
  colHalf: { flex: 1 },
  subTitle: { fontSize: 8, fontWeight: 700, color: "#475569", marginBottom: 4, marginTop: 6 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
});

const DataRow = ({ label, value, bold = false }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}:</Text>
      <Text style={[styles.dataValue, bold && styles.dataValueBold]}>{value}</Text>
    </View>
  );
};

export default function EnrollmentPDF({ enrollment, programLabel, studyTypeLabel, photoUrl }) {
  Font.register({
    family: "Roboto",
    fonts: [
      { src: join(process.cwd(), "src", "fonts", "Roboto-Regular.woff"), fontWeight: 400 },
      { src: join(process.cwd(), "src", "fonts", "Roboto-Bold.woff"), fontWeight: 700 },
    ],
  });
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("hr-HR") : "—");

  const application = enrollment.applications;
  const intake = enrollment.intakes;
  const enrollmentTypeLabel = enrollment.enrollment_type ? enrollmentTypeOptions.find((o) => o.value === enrollment.enrollment_type)?.label : null;
  const coursesS1 = enrollment.selected_courses_s1 ?? [];
  const coursesS2 = enrollment.selected_courses_s2 ?? [];
  const totalS1 = coursesS1.reduce((sum, c) => sum + (c.credits ?? 0), 0);
  const totalS2 = coursesS2.reduce((sum, c) => sum + (c.credits ?? 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.facultyName}>Sveučilište u Splitu, Pomorski fakultet</Text>
          <Text style={styles.documentTitle}>Upisni list - diplomski studij</Text>
        </View>

        {/* Podaci o studiju */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PODACI O STUDIJU</Text>
          <DataRow label="Studij" value={programLabel} bold />
          <DataRow label="Vrsta studiranja" value={studyTypeLabel} />
          <DataRow label="Vrsta upisa" value={intake?.title} />
          <DataRow label="Akademska godina" value={intake?.academic_year} />
        </View>

        {/* Osobni podaci */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OSOBNI PODACI UPISA</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flexDirection: "row", gap: 12, flex: 1 }}>
              <View style={styles.photoBox}>
                {photoUrl ? (
                  <PDFImage src={photoUrl} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>Nema{"\n"}fotografije</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <DataRow label="Ime i prezime" value={`${application?.first_name ?? ""} ${application?.last_name ?? ""}`} bold />
                <DataRow label="JMBAG" value={enrollment.jmbag} />
                <DataRow label="OIB" value={application?.oib} />
                <DataRow label="Mjesto rođenja" value={enrollment.birth_place} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <DataRow label="Spol" value={enrollment.gender} />
              <DataRow label="Bračno stanje" value={enrollment.marital_status} />
              <DataRow label="Email" value={application?.email} />
              <DataRow label="Mobitel" value={application?.phone} />
              <DataRow label="Izjava o upisu" value={enrollmentTypeLabel} />
            </View>
          </View>
        </View>

        {/* Roditelji */}
        {(enrollment.father_name || enrollment.mother_name) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PODACI O RODITELJIMA</Text>
            <View style={styles.twoCol}>
              <View style={styles.colHalf}>
                <Text style={styles.subTitle}>Otac</Text>
                <DataRow label="Ime" value={enrollment.father_name} />
                <DataRow label="Zanimanje" value={enrollment.father_occupation} />
                <DataRow label="Adresa" value={enrollment.father_address} />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.subTitle}>Majka</Text>
                <DataRow label="Ime" value={enrollment.mother_name} />
                <DataRow label="Zanimanje" value={enrollment.mother_occupation} />
                <DataRow label="Adresa" value={enrollment.mother_address} />
              </View>
            </View>
          </View>
        )}

        {/* Izborni predmeti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ODABRANI IZBORNI PREDMETI</Text>
          <Text style={styles.subTitle}>1. semestar</Text>
          {coursesS1.length === 0 ? (
            <Text style={{ fontSize: 8, color: "#64748b" }}>Nema odabranih predmeta.</Text>
          ) : (
            <>
              {coursesS1.map((c) => (
                <DataRow key={c.id} label={c.name} value={`${c.credits} ECTS`} />
              ))}
              <DataRow label="Ukupno" value={`${totalS1} ECTS`} bold />
            </>
          )}
          <Text style={styles.subTitle}>2. semestar</Text>
          {coursesS2.length === 0 ? (
            <Text style={{ fontSize: 8, color: "#64748b" }}>Nema odabranih predmeta.</Text>
          ) : (
            <>
              {coursesS2.map((c) => (
                <DataRow key={c.id} label={c.name} value={`${c.credits} ECTS`} />
              ))}
              <DataRow label="Ukupno" value={`${totalS2} ECTS`} bold />
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: "#0f385c" }}>Sveučilište u Splitu · Pomorski fakultet</Text>
            <Text style={{ fontSize: 8, fontWeight: 700, color: "#0f385c" }}>Datum upisa: {formatDate(new Date().toISOString())}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

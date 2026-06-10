import React from "react";
import { Document, Page, Text, View, StyleSheet, Image as PDFImage, Font } from "@react-pdf/renderer";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

Font.register({
  family: "Roboto",
  fonts: [
    { src: join(__dirname, "..", "fonts", "Roboto-Regular.ttf"), fontWeight: 400 },
    { src: join(__dirname, "..", "fonts", "Roboto-Bold.ttf"), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Roboto", backgroundColor: "#FFFFFF" },
  header: {
    marginBottom: 20, paddingBottom: 14,
    borderBottomWidth: 2, borderBottomColor: "#0f385c", borderBottomStyle: "solid",
  },
  universityName: { fontSize: 15, fontWeight: 700, color: "#0f385c", marginBottom: 3 },
  facultyName: { fontSize: 10, color: "#666666", marginBottom: 8 },
  documentTitle: { fontSize: 18, fontWeight: 700, color: "#058cc4", letterSpacing: 0.8 },
  infoBar: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#f0f8fd", padding: 10, marginBottom: 18,
    borderRadius: 4, borderWidth: 1, borderColor: "#c8e6f5", borderStyle: "solid",
  },
  infoItem: { flexDirection: "column", gap: 2 },
  infoLabel: { fontSize: 7, color: "#888888", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 9, fontWeight: 700, color: "#0f385c" },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 9, fontWeight: 700, color: "#0f385c",
    marginBottom: 7, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: "#e2e8f0", borderBottomStyle: "solid",
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  sectionWithPhoto: { flexDirection: "row", gap: 16, marginBottom: 14 },
  sectionContent: { flex: 1 },
  photoBox: {
    width: 90, height: 90,
    borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid",
    borderRadius: 4, overflow: "hidden", flexShrink: 0, backgroundColor: "#f8fafc",
  },
  photo: { width: 90, height: 90, objectFit: "cover" },
  photoPlaceholder: {
    width: 90, height: 90, backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
  },
  photoPlaceholderText: { fontSize: 7, color: "#94a3b8", textAlign: "center" },
  dataRow: {
    flexDirection: "row", paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: "#f8fafc", borderBottomStyle: "solid",
  },
  dataLabel: { width: "38%", fontSize: 8, color: "#64748b" },
  dataValue: { width: "62%", fontSize: 9, color: "#0f172a" },
  dataValueBold: { fontWeight: 700 },
  twoCol: { flexDirection: "row", gap: 16 },
  colHalf: { flex: 1 },
  subTitle: { fontSize: 8, fontWeight: 700, color: "#475569", marginBottom: 4, marginTop: 6 },
  footer: {
    position: "absolute", bottom: 30, left: 40, right: 40,
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#e2e8f0", borderTopStyle: "solid",
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
  },
  signatureLine: {
    marginTop: 32, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: "#000000", borderTopStyle: "solid",
    width: 140, textAlign: "center", fontSize: 7, color: "#64748b",
  },
  footerText: { fontSize: 7, color: "#94a3b8" },
});

const DataRow = ({ label, value, bold = false }) => (
  <View style={styles.dataRow}>
    <Text style={styles.dataLabel}>{label}:</Text>
    <Text style={[styles.dataValue, bold && styles.dataValueBold]}>{value || "—"}</Text>
  </View>
);

export default function ApplicationPDF({ application, programLabel, studyTypeLabel, statusLabel, photoUrl }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("hr-HR") : "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.facultyName}>Sveučilište u Splitu</Text>
          <Text style={styles.universityName}>POMORSKI FAKULTET</Text>
          <Text style={styles.documentTitle}>UPISNI LIST</Text>
        </View>

        {/* Info Bar — status kao običan tekst */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Broj prijave</Text>
            <Text style={styles.infoValue}>{application.application_number}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Datum prijave</Text>
            <Text style={styles.infoValue}>{formatDate(application.created_at)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{statusLabel}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Ak. godina</Text>
            <Text style={styles.infoValue}>{application.intakes?.academic_year || "—"}</Text>
          </View>
        </View>

        {/* Osobni podaci */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OSOBNI PODACI</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            {/* Lijevo: foto + prvi stupac */}
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
                <DataRow label="JMBAG" value="  " />
                <DataRow label="Ime i prezime" value={`${application.first_name} ${application.last_name}`} bold />
                <DataRow label="OIB" value={application.oib} />
                <DataRow label="Datum rođenja" value={formatDate(application.birth_date)} />
                <DataRow label="Mjesto rođenja" value={application.birth_place} />
              </View>
            </View>
            {/* Desno: drugi stupac */}
            <View style={{ flex: 1 }}>
              <DataRow label="Spol" value={application.gender} />
              <DataRow label="Bračno stanje" value={application.marital_status} />
              <DataRow label="Državljanstvo" value={application.citizenship} />
              <DataRow label="Email" value={application.email} />
              <DataRow label="Mobitel" value={application.phone} />
              <DataRow label="Adresa boravka" value={`${application.address || ""}, ${application.postal_code || ""} ${application.city || ""}`.trim()} />
            </View>
          </View>
        </View>



        {/* Roditelji */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PODACI O RODITELJIMA</Text>
          <View style={styles.twoCol}>
            <View style={styles.colHalf}>
              <Text style={styles.subTitle}>Otac</Text>
              <DataRow label="Ime" value={application.father_name} />
              <DataRow label="Zanimanje" value={application.father_occupation} />
              <DataRow label="Adresa" value={application.father_address} />
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.subTitle}>Majka</Text>
              <DataRow label="Ime" value={application.mother_name} />
              <DataRow label="Zanimanje" value={application.mother_occupation} />
              <DataRow label="Adresa" value={application.mother_address} />
            </View>
          </View>
        </View>

        {/* Upis + Obrazovanje u dva stupca */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>PODACI O UPISU</Text>
            <DataRow label="Vrsta upisa" value={application.intakes?.title} bold />
            <DataRow label="Akademska godina" value={application.intakes?.academic_year} />
            <DataRow label="Studij" value={programLabel} bold />
            <DataRow label="Vrsta studiranja" value={studyTypeLabel} />
            <DataRow label="Plasman na rang listi" value={application.ranking_score} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>PRETHODNO OBRAZOVANJE</Text>
            <DataRow label="Završena srednja škola" value={application.previous_institution} />
            <DataRow label="Program / smjer" value={application.previous_program} />
            <DataRow label="Godina završetka" value={application.previous_completion_year} />
            <DataRow label="Drugi fakultet / viša škola" value={application.other_education} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <View style={styles.signatureLine}>
              <Text>Potpis kandidata</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: "#0f385c" }}>
              Sveučilište u Splitu · Pomorski fakultet
            </Text>
            <Text style={styles.footerText}>Datum ispisa: {formatDate(new Date().toISOString())}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

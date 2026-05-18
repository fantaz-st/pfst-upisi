import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register fonts (optional - for better typography)
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf", fontWeight: 300 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf", fontWeight: 500 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Roboto",
    backgroundColor: "#FFFFFF",
  },
  header: {
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#0D2B52",
    borderBottomStyle: "solid",
  },
  universityName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0D2B52",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  facultyName: {
    fontSize: 11,
    color: "#666666",
    textAlign: "center",
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1B6CA8",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 1,
  },
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F5F7FA",
    padding: 10,
    marginBottom: 25,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "solid",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#666666",
  },
  infoValue: {
    fontSize: 9,
    fontWeight: 600,
    color: "#000000",
  },
  statusBadge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 600,
    color: "#1976D2",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0D2B52",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    borderBottomStyle: "solid",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    borderBottomStyle: "solid",
  },
  dataLabel: {
    width: "35%",
    fontSize: 9,
    color: "#666666",
    fontWeight: 500,
  },
  dataValue: {
    width: "65%",
    fontSize: 10,
    color: "#000000",
    fontWeight: 400,
  },
  dataValueBold: {
    fontWeight: 700,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#666666",
  },
  signatureSection: {
    marginTop: 10,
  },
  signatureLine: {
    marginTop: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "solid",
    width: 150,
    textAlign: "center",
    fontSize: 8,
  },
  pageNumber: {
    fontSize: 8,
  },
});

const DataRow = ({ label, value, bold = false }) => (
  <View style={styles.dataRow}>
    <Text style={styles.dataLabel}>{label}:</Text>
    <Text style={[styles.dataValue, bold && styles.dataValueBold]}>{value || "—"}</Text>
  </View>
);

export default function ApplicationPDF({ application, programLabel, studyTypeLabel, statusLabel }) {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("hr-HR");
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.facultyName}>Sveučilište u Splitu</Text>
          <Text style={styles.universityName}>POMORSKI FAKULTET</Text>
          <Text style={styles.documentTitle}>UPISNI LIST</Text>
        </View>

        {/* Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Broj prijave:</Text>
            <Text style={styles.infoValue}>{application.application_number}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Datum prijave:</Text>
            <Text style={styles.infoValue}>{formatDate(application.created_at)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.statusBadge}>{statusLabel}</Text>
          </View>
        </View>

        {/* Applicant Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PODACI O KANDIDATU</Text>
          <DataRow label="Ime i prezime" value={`${application.first_name} ${application.last_name}`} bold />
          <DataRow label="OIB" value={application.oib} />
          <DataRow label="Datum rođenja" value={formatDate(application.birth_date)} />
          <DataRow label="Državljanstvo" value={application.citizenship} />
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KONTAKT PODACI</Text>
          <DataRow label="Email adresa" value={application.email} />
          <DataRow label="Mobitel" value={application.phone} />
          <DataRow label="Adresa" value={application.address} />
          <DataRow label="Grad" value={`${application.postal_code} ${application.city}`} />
        </View>

        {/* Study Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PODACI O UPISU</Text>
          <DataRow label="Vrsta upisa" value={application.intakes?.title} bold />
          <DataRow label="Akademska godina" value={application.intakes?.academic_year} />
          <DataRow label="Studij" value={programLabel} bold />
          <DataRow label="Vrsta studiranja" value={studyTypeLabel} />
        </View>

        {/* Previous Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRETHODNO OBRAZOVANJE</Text>
          <DataRow label="Ustanova" value={application.previous_institution} />
          <DataRow label="Program / smjer" value={application.previous_program} />
          <DataRow label="Godina završetka" value={application.previous_completion_year} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.signatureSection}>
            <View style={styles.signatureLine}>
              <Text>Potpis kandidata</Text>
            </View>
          </View>
          <View>
            <Text style={styles.pageNumber}>Datum ispisa: {formatDate(new Date().toISOString())}</Text>
            <Text style={styles.pageNumber}>Stranica 1 od 1</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

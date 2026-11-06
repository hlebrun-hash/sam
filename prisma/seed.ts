import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seed SAM en cours...")

  // Nettoyage
  await prisma.auditLog.deleteMany()
  await prisma.visit.deleteMany()
  await prisma.triageRequest.deleteMany()
  await prisma.recordVersion.deleteMany()
  await prisma.emergencyContact.deleteMany()
  await prisma.medicalHistory.deleteMany()
  await prisma.medication.deleteMany()
  await prisma.allergy.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.user.deleteMany()
  await prisma.hospital.deleteMany()

  const passwordHash = await bcrypt.hash("demo1234", 10)

  // ───────────────── ÉTABLISSEMENTS ─────────────────
  // Les deux hôpitaux principaux (références FK pour staff et visites)
  const versailles = await prisma.hospital.create({
    data: {
      name: "CH de Versailles — Hôpital André Mignot",
      type: "CH",
      city: "Le Chesnay-Rocquencourt",
      address: "177 Rue de Versailles, 78150 Le Chesnay-Rocquencourt",
      phone: "01 39 63 91 33",
      bedCount: 450,
      pricePerBed: 5.0,
      lat: 48.8248,
      lng: 2.1256,
    },
  })

  const saintCloud = await prisma.hospital.create({
    data: {
      name: "CH des Quatre Villes — Site Saint-Cloud",
      type: "CH",
      city: "Saint-Cloud",
      address: "3 Place Silly, 92210 Saint-Cloud",
      phone: "01 77 70 70 70",
      bedCount: 180,
      pricePerBed: 5.0,
      lat: 48.8451,
      lng: 2.2054,
    },
  })

  // CHU — Urgences critiques & Réanimation (AP-HP)
  await prisma.hospital.createMany({
    data: [
      { name: "AP-HP Pitié-Salpêtrière", type: "CHU", city: "Paris 13e", address: "47-83 Boulevard de l'Hôpital, 75013 Paris", phone: "01 42 16 00 00", bedCount: 900, pricePerBed: 5.0, lat: 48.8390, lng: 2.3570 },
      { name: "AP-HP Hôpital Européen Georges-Pompidou", type: "CHU", city: "Paris 15e", address: "20 Rue Leblanc, 75015 Paris", phone: "01 56 09 20 00", bedCount: 800, pricePerBed: 5.0, lat: 48.8378, lng: 2.2748 },
      { name: "AP-HP Bichat — Claude-Bernard", type: "CHU", city: "Paris 18e", address: "46 Rue Henri Huchard, 75018 Paris", phone: "01 40 25 80 80", bedCount: 650, pricePerBed: 5.0, lat: 48.8961, lng: 2.3380 },
      { name: "AP-HP Hôpital Saint-Louis", type: "CHU", city: "Paris 10e", address: "1 Avenue Claude Vellefaux, 75010 Paris", phone: "01 42 49 49 49", bedCount: 700, pricePerBed: 5.0, lat: 48.8743, lng: 2.3618 },
      { name: "AP-HP Hôpital Lariboisière", type: "CHU", city: "Paris 10e", address: "2 Rue Ambroise Paré, 75010 Paris", phone: "01 49 95 65 65", bedCount: 580, pricePerBed: 5.0, lat: 48.8793, lng: 2.3570 },
      { name: "AP-HP Hôpital Cochin — Port-Royal", type: "CHU", city: "Paris 14e", address: "27 Rue du Faubourg Saint-Jacques, 75014 Paris", phone: "01 58 41 41 41", bedCount: 750, pricePerBed: 5.0, lat: 48.8369, lng: 2.3391 },
      { name: "AP-HP Hôpital Saint-Antoine", type: "CHU", city: "Paris 12e", address: "184 Rue du Faubourg Saint-Antoine, 75012 Paris", phone: "01 49 28 20 00", bedCount: 620, pricePerBed: 5.0, lat: 48.8505, lng: 2.3870 },
      { name: "AP-HP Hôpital Tenon", type: "CHU", city: "Paris 20e", address: "4 Rue de la Chine, 75020 Paris", phone: "01 56 01 70 00", bedCount: 500, pricePerBed: 5.0, lat: 48.8655, lng: 2.4034 },
      { name: "AP-HP Hôpital Necker — Enfants Malades", type: "CHU", city: "Paris 15e", address: "149 Rue de Sèvres, 75015 Paris", phone: "01 44 49 40 00", bedCount: 600, pricePerBed: 5.0, lat: 48.8456, lng: 2.3157 },
      { name: "AP-HP Hôpital Robert-Debré", type: "CHU", city: "Paris 19e", address: "48 Boulevard Sérurier, 75019 Paris", phone: "01 40 03 20 00", bedCount: 550, pricePerBed: 5.0, lat: 48.8836, lng: 2.3832 },
      { name: "AP-HP Hôpital Armand-Trousseau", type: "CHU", city: "Paris 12e", address: "26 Avenue du Dr Arnold Netter, 75012 Paris", phone: "01 44 73 70 00", bedCount: 450, pricePerBed: 5.0, lat: 48.8463, lng: 2.3932 },
      { name: "AP-HP Hôpital Ambroise-Paré", type: "CHU", city: "Boulogne-Billancourt", address: "9 Avenue Charles de Gaulle, 92100 Boulogne-Billancourt", phone: "01 49 09 50 00", bedCount: 500, pricePerBed: 5.0, lat: 48.8358, lng: 2.2378 },
      { name: "AP-HP Hôpital Antoine-Béclère", type: "CHU", city: "Clamart", address: "157 Rue de la Porte de Trivaux, 92140 Clamart", phone: "01 45 37 44 44", bedCount: 480, pricePerBed: 5.0, lat: 48.7900, lng: 2.2648 },
      { name: "AP-HP Hôpital Raymond-Poincaré", type: "CHU", city: "Garches", address: "104 Boulevard Raymond Poincaré, 92380 Garches", phone: "01 47 10 79 00", bedCount: 420, pricePerBed: 5.0, lat: 48.8381, lng: 2.1870 },
      { name: "AP-HP Hôpital Louis-Mourier", type: "CHU", city: "Colombes", address: "178 Rue des Renouillers, 92700 Colombes", phone: "01 47 60 61 62", bedCount: 460, pricePerBed: 5.0, lat: 48.9239, lng: 2.2480 },
      { name: "AP-HP Hôpital Avicenne", type: "CHU", city: "Bobigny", address: "125 Rue de Stalingrad, 93000 Bobigny", phone: "01 48 95 55 55", bedCount: 530, pricePerBed: 5.0, lat: 48.9088, lng: 2.4327 },
      { name: "AP-HP Hôpital Jean-Verdier", type: "CHU", city: "Bondy", address: "Avenue du 14 Juillet, 93140 Bondy", phone: "01 48 02 66 66", bedCount: 400, pricePerBed: 5.0, lat: 48.9070, lng: 2.4823 },
      { name: "AP-HP Hôpital Henri-Mondor", type: "CHU", city: "Créteil", address: "51 Avenue du Maréchal de Lattre de Tassigny, 94010 Créteil", phone: "01 49 81 21 11", bedCount: 700, pricePerBed: 5.0, lat: 48.7894, lng: 2.4578 },
      { name: "AP-HP Hôpital Bicêtre", type: "CHU", city: "Le Kremlin-Bicêtre", address: "78 Rue du Général Leclerc, 94270 Le Kremlin-Bicêtre", phone: "01 45 21 21 21", bedCount: 650, pricePerBed: 5.0, lat: 48.8135, lng: 2.3598 },
    ],
  })

  // CH Général — Urgences polyvalentes (hors versailles et saintCloud déjà créés)
  await prisma.hospital.createMany({
    data: [
      { name: "CHI Poissy / Saint-Germain", type: "CH", city: "Poissy", address: "10 Rue du Champ Gaillard, 78300 Poissy", phone: "01 39 27 50 00", bedCount: 380, pricePerBed: 5.0, lat: 48.9304, lng: 2.0421 },
      { name: "CH François Quesnay", type: "CH", city: "Mantes-la-Jolie", address: "2 Boulevard Sully, 78200 Mantes-la-Jolie", phone: "01 34 97 40 00", bedCount: 320, pricePerBed: 5.0, lat: 48.9890, lng: 1.7170 },
      { name: "CH de Rambouillet", type: "CH", city: "Rambouillet", address: "5-7 Rue Pierre et Marie Curie, 78120 Rambouillet", phone: "01 39 63 80 00", bedCount: 220, pricePerBed: 5.0, lat: 48.6480, lng: 1.8300 },
      { name: "CHI Meulan — Les Mureaux", type: "CH", city: "Meulan-en-Yvelines", address: "1 Rue du Fort, 78250 Meulan-en-Yvelines", phone: "01 30 91 85 00", bedCount: 200, pricePerBed: 5.0, lat: 49.0120, lng: 1.9030 },
      { name: "Hôpital Foch", type: "CH", city: "Suresnes", address: "40 Rue Worth, 92150 Suresnes", phone: "01 46 25 20 00", bedCount: 350, pricePerBed: 5.0, lat: 48.8690, lng: 2.2170 },
      { name: "HIA Percy", type: "CH", city: "Clamart", address: "101 Avenue Henri Barbusse, 92140 Clamart", phone: "01 41 46 60 00", bedCount: 300, pricePerBed: 5.0, lat: 48.7892, lng: 2.2650 },
      { name: "CH Rives de Seine — Neuilly", type: "CH", city: "Neuilly-sur-Seine", address: "36 Boulevard du Général Leclerc, 92200 Neuilly-sur-Seine", phone: "01 40 88 60 00", bedCount: 280, pricePerBed: 5.0, lat: 48.8847, lng: 2.2680 },
      { name: "CASH de Nanterre — Max Fourestier", type: "CH", city: "Nanterre", address: "403 Avenue de la République, 92000 Nanterre", phone: "01 47 69 65 65", bedCount: 350, pricePerBed: 5.0, lat: 48.8923, lng: 2.2070 },
      { name: "CH de Saint-Denis — Delafontaine", type: "CH", city: "Saint-Denis", address: "2 Rue du Docteur Delafontaine, 93200 Saint-Denis", phone: "01 42 35 61 40", bedCount: 420, pricePerBed: 5.0, lat: 48.9361, lng: 2.3579 },
      { name: "CHI André Grégoire", type: "CH", city: "Montreuil", address: "56 Boulevard de la Boissière, 93100 Montreuil", phone: "01 49 20 30 40", bedCount: 300, pricePerBed: 5.0, lat: 48.8631, lng: 2.4435 },
      { name: "CHI Robert Ballanger", type: "CH", city: "Aulnay-sous-Bois", address: "Boulevard Robert Ballanger, 93600 Aulnay-sous-Bois", phone: "01 49 36 30 00", bedCount: 380, pricePerBed: 5.0, lat: 48.9394, lng: 2.4942 },
      { name: "CHI Le Raincy — Montfermeil", type: "CH", city: "Montfermeil", address: "10 Avenue du Général Leclerc, 93370 Montfermeil", phone: "01 41 70 80 00", bedCount: 290, pricePerBed: 5.0, lat: 48.9014, lng: 2.5673 },
      { name: "CHI de Créteil", type: "CH", city: "Créteil", address: "40 Avenue de Verdun, 94000 Créteil", phone: "01 45 17 50 00", bedCount: 350, pricePerBed: 5.0, lat: 48.7897, lng: 2.4568 },
      { name: "CHI de Villeneuve-Saint-Georges", type: "CH", city: "Villeneuve-Saint-Georges", address: "40 Allée de la Source, 94190 Villeneuve-Saint-Georges", phone: "01 43 86 20 00", bedCount: 320, pricePerBed: 5.0, lat: 48.7342, lng: 2.4441 },
      { name: "HIA Bégin", type: "CH", city: "Saint-Mandé", address: "69 Avenue de Paris, 94160 Saint-Mandé", phone: "01 43 98 50 00", bedCount: 260, pricePerBed: 5.0, lat: 48.8458, lng: 2.4152 },
      { name: "Centre Hospitalier Sud Francilien", type: "CH", city: "Corbeil-Essonnes", address: "40 Avenue Serge Dassault, 91100 Corbeil-Essonnes", phone: "01 61 69 61 69", bedCount: 500, pricePerBed: 5.0, lat: 48.6093, lng: 2.4792 },
      { name: "GHNE — Site d'Orsay", type: "CH", city: "Orsay", address: "4 Place du Général Leclerc, 91400 Orsay", phone: "01 69 29 75 75", bedCount: 220, pricePerBed: 5.0, lat: 48.6967, lng: 2.1890 },
      { name: "GHNE — Site de Longjumeau", type: "CH", city: "Longjumeau", address: "159 Rue du Pdt François Mitterrand, 91160 Longjumeau", phone: "01 64 54 33 33", bedCount: 200, pricePerBed: 5.0, lat: 48.6947, lng: 2.2985 },
      { name: "CH d'Arpajon", type: "CH", city: "Arpajon", address: "18 Avenue de Verdun, 91290 Arpajon", phone: "01 64 92 92 92", bedCount: 180, pricePerBed: 5.0, lat: 48.5906, lng: 2.2459 },
      { name: "CH Sud Essonne — Étampes", type: "CH", city: "Étampes", address: "26 Avenue Charles de Gaulle, 91150 Étampes", phone: "01 60 80 76 76", bedCount: 160, pricePerBed: 5.0, lat: 48.4345, lng: 2.1618 },
      { name: "CH Victor Dupouy", type: "CH", city: "Argenteuil", address: "69 Rue du Lt-Colonel Prudhon, 95100 Argenteuil", phone: "01 34 23 24 25", bedCount: 400, pricePerBed: 5.0, lat: 48.9472, lng: 2.2449 },
      { name: "CH René-Dubos — Pontoise", type: "CH", city: "Pontoise", address: "6 Avenue de l'Île-de-France, 95300 Pontoise", phone: "01 30 75 40 40", bedCount: 420, pricePerBed: 5.0, lat: 49.0516, lng: 2.0984 },
      { name: "CH de Gonesse", type: "CH", city: "Gonesse", address: "25 Rue Pierre de Theilley, 95500 Gonesse", phone: "01 34 53 21 21", bedCount: 300, pricePerBed: 5.0, lat: 48.9873, lng: 2.4567 },
      { name: "GHCPO — Beaumont-sur-Oise", type: "CH", city: "Beaumont-sur-Oise", address: "25 Rue Edmond Turcq, 95260 Beaumont-sur-Oise", phone: "01 39 37 15 15", bedCount: 180, pricePerBed: 5.0, lat: 49.1428, lng: 2.2888 },
      { name: "GHEF — Site de Meaux", type: "CH", city: "Meaux", address: "6-8 Rue Saint-Fiacre, 77100 Meaux", phone: "01 64 35 38 38", bedCount: 380, pricePerBed: 5.0, lat: 48.9598, lng: 2.8878 },
      { name: "GHEF — Site de Jossigny", type: "CH", city: "Jossigny", address: "2-4 Cours de la Gondoire, 77600 Jossigny", phone: "01 61 10 61 10", bedCount: 320, pricePerBed: 5.0, lat: 48.8477, lng: 2.7384 },
      { name: "GHEF — Site de Coulommiers", type: "CH", city: "Coulommiers", address: "4 Rue Gabriel Péri, 77120 Coulommiers", phone: "01 64 65 37 00", bedCount: 160, pricePerBed: 5.0, lat: 48.8148, lng: 3.0813 },
      { name: "GH Sud Île-de-France — Melun", type: "CH", city: "Melun", address: "270 Avenue Marc Jacquet, 77000 Melun", phone: "01 81 74 17 17", bedCount: 350, pricePerBed: 5.0, lat: 48.5407, lng: 2.6629 },
      { name: "CH Sud Seine-et-Marne — Fontainebleau", type: "CH", city: "Fontainebleau", address: "55 Boulevard du Maréchal Joffre, 77300 Fontainebleau", phone: "01 60 74 10 10", bedCount: 200, pricePerBed: 5.0, lat: 48.4039, lng: 2.7006 },
      { name: "CH Sud Seine-et-Marne — Montereau", type: "CH", city: "Montereau-Fault-Yonne", address: "1 bis Rue Victor Hugo, 77130 Montereau-Fault-Yonne", phone: "01 64 31 64 31", bedCount: 160, pricePerBed: 5.0, lat: 48.3827, lng: 2.9480 },
      { name: "CH Léon Binet — Provins", type: "CH", city: "Provins", address: "Route de Chalautre, 77160 Provins", phone: "01 64 60 40 40", bedCount: 180, pricePerBed: 5.0, lat: 48.5597, lng: 3.2993 },
    ],
  })

  // Cliniques privées — Chirurgie programmée & Urgences légères
  await prisma.hospital.createMany({
    data: [
      { name: "Clinique du Mont-Louis (ELSAN)", type: "CLINIQUE", city: "Paris 11e", address: "8-10 Rue de la Folie-Régnault, 75011 Paris", phone: "01 43 56 56 56", bedCount: 150, pricePerBed: 5.0, lat: 48.8590, lng: 2.3786 },
      { name: "Clinique Geoffroy Saint-Hilaire (ELSAN)", type: "CLINIQUE", city: "Paris 5e", address: "59 Rue Geoffroy-Saint-Hilaire, 75005 Paris", phone: "01 44 08 40 00", bedCount: 100, pricePerBed: 5.0, lat: 48.8502, lng: 2.3502 },
      { name: "Hôpital Privé des Peupliers (Ramsay)", type: "CLINIQUE", city: "Paris 13e", address: "8 Place de l'Abbé Georges Hénocque, 75013 Paris", phone: "01 44 16 52 00", bedCount: 130, pricePerBed: 5.0, lat: 48.8322, lng: 2.3561 },
      { name: "Clinique Int. du Parc Monceau (Almaviva)", type: "CLINIQUE", city: "Paris 17e", address: "21 Rue de Chazelles, 75017 Paris", phone: "01 48 88 25 25", bedCount: 90, pricePerBed: 5.0, lat: 48.8832, lng: 2.3100 },
      { name: "Clinique Bizet (Vivalto Santé)", type: "CLINIQUE", city: "Paris 16e", address: "23 Rue Georges Bizet, 75016 Paris", phone: "01 40 69 34 34", bedCount: 110, pricePerBed: 5.0, lat: 48.8630, lng: 2.2650 },
      { name: "Hôpital Privé d'Antony (Ramsay)", type: "CLINIQUE", city: "Antony", address: "1 Rue Velpeau, 92160 Antony", phone: "01 46 74 37 00", bedCount: 200, pricePerBed: 5.0, lat: 48.7533, lng: 2.2975 },
      { name: "Hôpital Privé de l'Ouest Parisien (Ramsay)", type: "CLINIQUE", city: "Trappes", address: "14 Rue Castiglione del Lago, 78190 Trappes", phone: "01 30 69 44 44", bedCount: 170, pricePerBed: 5.0, lat: 48.7726, lng: 2.0010 },
      { name: "Hôpital Privé de Parly 2 (Ramsay)", type: "CLINIQUE", city: "Le Chesnay-Rocquencourt", address: "21 Rue Moxouris, 78150 Le Chesnay-Rocquencourt", phone: "01 39 63 70 00", bedCount: 160, pricePerBed: 5.0, lat: 48.8248, lng: 2.1256 },
      { name: "Clinique de l'Estrée (ELSAN)", type: "CLINIQUE", city: "Stains", address: "35 Rue d'Amiens, 93240 Stains", phone: "01 49 71 71 71", bedCount: 150, pricePerBed: 5.0, lat: 48.9545, lng: 2.3697 },
      { name: "Hôpital Privé du Vert Galant (Ramsay)", type: "CLINIQUE", city: "Tremblay-en-France", address: "38 Rue de Flandres, 93290 Tremblay-en-France", phone: "01 49 63 50 00", bedCount: 140, pricePerBed: 5.0, lat: 48.9770, lng: 2.5648 },
      { name: "Hôpital Privé de Seine-Saint-Denis (Ramsay)", type: "CLINIQUE", city: "Le Blanc-Mesnil", address: "7 Avenue Henri Barbusse, 93150 Le Blanc-Mesnil", phone: "01 45 91 66 66", bedCount: 120, pricePerBed: 5.0, lat: 48.9393, lng: 2.4568 },
      { name: "Clinique du Landy (ELSAN)", type: "CLINIQUE", city: "Saint-Ouen-sur-Seine", address: "23 Rue du Landy, 93400 Saint-Ouen-sur-Seine", phone: "01 49 48 50 00", bedCount: 110, pricePerBed: 5.0, lat: 48.9122, lng: 2.3344 },
      { name: "Hôpital Privé Armand Brillard (Ramsay)", type: "CLINIQUE", city: "Nogent-sur-Marne", address: "3-5 Avenue Watteau, 94130 Nogent-sur-Marne", phone: "01 49 74 88 88", bedCount: 150, pricePerBed: 5.0, lat: 48.8367, lng: 2.4832 },
      { name: "Hôpital Privé Paul d'Égine (Ramsay)", type: "CLINIQUE", city: "Champigny-sur-Marne", address: "4 Rue Marx Dormoy, 94500 Champigny-sur-Marne", phone: "01 49 83 20 00", bedCount: 130, pricePerBed: 5.0, lat: 48.8175, lng: 2.5147 },
      { name: "Hôpital Privé Jacques Cartier (Ramsay)", type: "CLINIQUE", city: "Massy", address: "6 Avenue du Noyer Lambert, 91300 Massy", phone: "01 60 13 60 60", bedCount: 180, pricePerBed: 5.0, lat: 48.7297, lng: 2.2683 },
      { name: "Hôpital Privé Claude Galien (Ramsay)", type: "CLINIQUE", city: "Quincy-sous-Sénart", address: "20 Route de Boussy Saint-Antoine, 91480 Quincy-sous-Sénart", phone: "01 69 00 20 00", bedCount: 140, pricePerBed: 5.0, lat: 48.6763, lng: 2.5566 },
      { name: "Clinique Claude Bernard (ELSAN)", type: "CLINIQUE", city: "Ermont", address: "9 Rue Louis Armand, 95120 Ermont", phone: "01 30 72 33 33", bedCount: 130, pricePerBed: 5.0, lat: 48.9929, lng: 2.2616 },
      { name: "Clinique Sainte-Marie (Vivalto)", type: "CLINIQUE", city: "Osny", address: "1 Rue Christian Doppler, 95520 Osny", phone: "01 34 20 90 00", bedCount: 110, pricePerBed: 5.0, lat: 49.0729, lng: 2.0592 },
      { name: "Clinique Conti (ELSAN)", type: "CLINIQUE", city: "L'Isle-Adam", address: "3 Chemin des Trois Sources, 95290 L'Isle-Adam", phone: "01 34 08 13 00", bedCount: 90, pricePerBed: 5.0, lat: 49.1079, lng: 2.2097 },
      { name: "Hôpital Privé Marne Chantereine (Ramsay)", type: "CLINIQUE", city: "Brou-sur-Chantereine", address: "Rue Carnot, 77177 Brou-sur-Chantereine", phone: "01 64 72 74 00", bedCount: 120, pricePerBed: 5.0, lat: 48.8723, lng: 2.6315 },
      { name: "Clinique Saint-Faron (ELSAN)", type: "CLINIQUE", city: "Mareuil-lès-Meaux", address: "1143 Rue Charles de Gaulle, 77100 Mareuil-lès-Meaux", phone: "01 64 35 34 35", bedCount: 100, pricePerBed: 5.0, lat: 48.9612, lng: 2.8698 },
      { name: "Clinique de Tournan (Ramsay)", type: "CLINIQUE", city: "Tournan-en-Brie", address: "2 Rue Jules Lefebvre, 77220 Tournan-en-Brie", phone: "01 64 42 42 42", bedCount: 110, pricePerBed: 5.0, lat: 48.7444, lng: 2.7693 },
    ],
  })

  // Centres de Soins d'Urgence (CSU) — Urgences légères sans hospitalisation
  await prisma.hospital.createMany({
    data: [
      { name: "CSU Paris Vaugirard", type: "CSU", city: "Paris 15e", address: "383 Rue de Vaugirard, 75015 Paris", phone: "01 45 30 05 05", bedCount: 0, pricePerBed: 5.0, lat: 48.8355, lng: 2.2938 },
      { name: "CSU Paris Étoile — Wagram", type: "CSU", city: "Paris 17e", address: "55 Avenue de Wagram, 75017 Paris", phone: "01 42 27 00 11", bedCount: 0, pricePerBed: 5.0, lat: 48.8842, lng: 2.3050 },
      { name: "SOS Médecins Paris 13e", type: "CSU", city: "Paris 13e", address: "85 Boulevard de Port-Royal, 75013 Paris", phone: "36 24", bedCount: 0, pricePerBed: 5.0, lat: 48.8372, lng: 2.3461 },
      { name: "SOS Médecins Paris 19e", type: "CSU", city: "Paris 19e", address: "180 Rue de Flandre, 75019 Paris", phone: "36 24", bedCount: 0, pricePerBed: 5.0, lat: 48.8831, lng: 2.3800 },
      { name: "CSU Clinique Marcel Sembat", type: "CSU", city: "Boulogne-Billancourt", address: "105 Avenue Victor Hugo, 92100 Boulogne-Billancourt", phone: "01 46 04 90 90", bedCount: 0, pricePerBed: 5.0, lat: 48.8350, lng: 2.2410 },
      { name: "CSU Neuilly-sur-Seine", type: "CSU", city: "Neuilly-sur-Seine", address: "148 Avenue Achille Peretti, 92200 Neuilly-sur-Seine", phone: "01 46 40 10 10", bedCount: 0, pricePerBed: 5.0, lat: 48.8847, lng: 2.2680 },
      { name: "CMSI Asnières-sur-Seine", type: "CSU", city: "Asnières-sur-Seine", address: "18 Rue de la Station, 92600 Asnières-sur-Seine", phone: "01 41 11 00 22", bedCount: 0, pricePerBed: 5.0, lat: 48.9140, lng: 2.2866 },
      { name: "CMSI Versailles — Grand Siècle", type: "CSU", city: "Versailles", address: "2 Place de Touraine, 78000 Versailles", phone: "01 39 50 12 12", bedCount: 0, pricePerBed: 5.0, lat: 48.8014, lng: 2.1301 },
      { name: "CSU de Saint-Germain-en-Laye", type: "CSU", city: "Saint-Germain-en-Laye", address: "20 Rue Armagis, 78100 Saint-Germain-en-Laye", phone: "01 39 10 20 30", bedCount: 0, pricePerBed: 5.0, lat: 48.8988, lng: 2.0940 },
      { name: "CMSI Saint-Quentin-en-Yvelines", type: "CSU", city: "Montigny-le-Bretonneux", address: "5 Boulevard Vauban, 78180 Montigny-le-Bretonneux", phone: "01 30 43 00 00", bedCount: 0, pricePerBed: 5.0, lat: 48.7762, lng: 2.0252 },
      { name: "CSMU Val d'Europe", type: "CSU", city: "Serris", address: "14 Cours du Danube, 77700 Serris", phone: "01 64 63 63 63", bedCount: 0, pricePerBed: 5.0, lat: 48.8578, lng: 2.7824 },
      { name: "CSU Sénart", type: "CSU", city: "Lieusaint", address: "12 Boulevard Olympe de Gouges, 77127 Lieusaint", phone: "01 64 13 40 00", bedCount: 0, pricePerBed: 5.0, lat: 48.6274, lng: 2.5484 },
      { name: "CSU Massy-Palaiseau", type: "CSU", city: "Massy", address: "10 Rue Galvani, 91300 Massy", phone: "01 69 75 22 22", bedCount: 0, pricePerBed: 5.0, lat: 48.7297, lng: 2.2683 },
      { name: "CMSI Évry-Courcouronnes", type: "CSU", city: "Évry-Courcouronnes", address: "1 Boulevard de l'Europe, 91000 Évry-Courcouronnes", phone: "01 60 78 50 50", bedCount: 0, pricePerBed: 5.0, lat: 48.6279, lng: 2.4278 },
      { name: "Point SOS Médecins Bobigny — Pantin", type: "CSU", city: "Bobigny", address: "21 Rue de Paris, 93000 Bobigny", phone: "36 24", bedCount: 0, pricePerBed: 5.0, lat: 48.9074, lng: 2.4397 },
      { name: "CSU Saint-Denis Centre", type: "CSU", city: "Saint-Denis", address: "45 Rue Gabriel Péri, 93200 Saint-Denis", phone: "01 48 20 10 10", bedCount: 0, pricePerBed: 5.0, lat: 48.9361, lng: 2.3579 },
      { name: "CSU Créteil Soleil", type: "CSU", city: "Créteil", address: "Avenue de la France Libre, 94000 Créteil", phone: "01 49 80 15 15", bedCount: 0, pricePerBed: 5.0, lat: 48.7897, lng: 2.4568 },
      { name: "CMSI Cergy-Pontoise", type: "CSU", city: "Cergy", address: "12 Boulevard du Port, 95000 Cergy", phone: "01 34 24 00 24", bedCount: 0, pricePerBed: 5.0, lat: 49.0383, lng: 2.0769 },
      { name: "CSU Enghien-les-Bains", type: "CSU", city: "Enghien-les-Bains", address: "38 Rue du Général de Gaulle, 95880 Enghien-les-Bains", phone: "01 39 64 50 50", bedCount: 0, pricePerBed: 5.0, lat: 48.9696, lng: 2.3091 },
    ],
  })

  console.log("✓ 95 établissements créés (19 CHU · 33 CH · 22 Cliniques · 19 CSU + 2 hôpitaux principaux)")

  // ───────────────── PERSONNEL ─────────────────
  const staffList = [
    { email: "accueil.versailles@sam.demo", role: "ACCUEIL", firstName: "Marc", lastName: "Lefebvre", hospitalId: versailles.id },
    { email: "iao.versailles@sam.demo", role: "IAO", firstName: "Claire", lastName: "Rousseau", hospitalId: versailles.id },
    { email: "infirmier.versailles@sam.demo", role: "INFIRMIER", firstName: "Pierre", lastName: "Moreau", hospitalId: versailles.id },
    { email: "urgentiste.versailles@sam.demo", role: "URGENTISTE", firstName: "François", lastName: "Renard", hospitalId: versailles.id },
    { email: "admin.versailles@sam.demo", role: "ADMIN_HOPITAL", firstName: "Antoine", lastName: "Blanc", hospitalId: versailles.id },
    { email: "accueil.saintcloud@sam.demo", role: "ACCUEIL", firstName: "Lucie", lastName: "Faure", hospitalId: saintCloud.id },
    { email: "iao.saintcloud@sam.demo", role: "IAO", firstName: "Marie", lastName: "Vidal", hospitalId: saintCloud.id },
    { email: "infirmier.saintcloud@sam.demo", role: "INFIRMIER", firstName: "Thomas", lastName: "Girard", hospitalId: saintCloud.id },
    { email: "urgentiste.saintcloud@sam.demo", role: "URGENTISTE", firstName: "Sophie", lastName: "Chevalier", hospitalId: saintCloud.id },
    { email: "admin.saintcloud@sam.demo", role: "ADMIN_HOPITAL", firstName: "Éric", lastName: "Fontaine", hospitalId: saintCloud.id },
  ]

  for (const s of staffList) {
    await prisma.user.create({
      data: {
        email: s.email,
        passwordHash,
        role: s.role,
        staff: {
          create: {
            firstName: s.firstName,
            lastName: s.lastName,
            hospitalId: s.hospitalId,
          },
        },
      },
    })
  }

  console.log("✓ Personnel créé (10 comptes)")

  // ───────────────── PATIENTS ─────────────────
  type AllergyInput = { name: string; severity: string; reaction?: string }
  type MedInput = { name: string; dosage?: string; frequency?: string }
  type HistInput = { condition: string; diagnosedAt?: Date }
  type ContactInput = { firstName: string; lastName: string; relationship: string; phone: string }

  type PatientData = {
    email: string
    firstName: string
    lastName: string
    birthDate: Date
    birthCity: string
    bloodGroup?: string
    validatedAt?: Date
    validatedBy?: string
    allergies?: AllergyInput[]
    medications?: MedInput[]
    histories?: HistInput[]
    contact?: ContactInput
    treatDoctor?: string
  }

  const patients: PatientData[] = [
    {
      // 1 — SCÉNARIO PATIENT INCONSCIENT
      email: "jean.dupont@sam.demo",
      firstName: "Jean",
      lastName: "Dupont",
      birthDate: new Date("1978-03-14"),
      birthCity: "Lyon",
      bloodGroup: "A-",
      validatedAt: new Date("2024-01-15"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [
        { name: "Pénicilline", severity: "ANAPHYLAXIE", reaction: "Choc anaphylactique immédiat" },
        { name: "Aspirine", severity: "GRAVE", reaction: "Urticaire généralisée, œdème de Quincke" },
      ],
      medications: [
        { name: "Metformine", dosage: "500mg", frequency: "2x/jour" },
        { name: "Ramipril", dosage: "5mg", frequency: "1x/jour matin" },
      ],
      histories: [
        { condition: "Diabète de type 2", diagnosedAt: new Date("2015-06-01") },
        { condition: "Hypertension artérielle", diagnosedAt: new Date("2018-03-15") },
      ],
      contact: { firstName: "Marie", lastName: "Dupont", relationship: "Épouse", phone: "06 12 34 56 78" },
      treatDoctor: "Dr. Henri Leclerc",
    },
    {
      // 2 — HOMONYME EXACT (même prénom + nom, ville différente)
      email: "jean.dupont2@sam.demo",
      firstName: "Jean",
      lastName: "Dupont",
      birthDate: new Date("1962-08-05"),
      birthCity: "Marseille",
      bloodGroup: "O+",
      validatedAt: new Date("2024-02-20"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [],
      contact: { firstName: "Bernard", lastName: "Dupont", relationship: "Frère", phone: "06 98 76 54 32" },
    },
    {
      // 3 — HOMONYME (même nom, prénom différent)
      email: "pierre.dupont@sam.demo",
      firstName: "Pierre",
      lastName: "Dupont",
      birthDate: new Date("1965-07-22"),
      birthCity: "Paris",
      bloodGroup: "B+",
      validatedAt: new Date("2024-01-30"),
      validatedBy: "Marie Vidal (IAO)",
      allergies: [],
    },
    {
      // 4 — Allergie anaphylaxique
      email: "sophie.bernard@sam.demo",
      firstName: "Sophie",
      lastName: "Bernard",
      birthDate: new Date("1992-04-18"),
      birthCity: "Lyon",
      bloodGroup: "AB+",
      validatedAt: new Date("2024-03-10"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [
        { name: "Noix", severity: "ANAPHYLAXIE", reaction: "Choc anaphylactique" },
        { name: "Noisettes", severity: "GRAVE", reaction: "Urticaire, œdème" },
      ],
      medications: [{ name: "EpiPen (adrénaline)", dosage: "0.3mg", frequency: "En cas d'urgence" }],
      contact: { firstName: "Paul", lastName: "Bernard", relationship: "Père", phone: "06 11 22 33 44" },
    },
    {
      // 5
      email: "thomas.leroy@sam.demo",
      firstName: "Thomas",
      lastName: "Leroy",
      birthDate: new Date("1958-09-30"),
      birthCity: "Bordeaux",
      bloodGroup: "O-",
      validatedAt: new Date("2024-02-05"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [{ name: "Produits iodés", severity: "GRAVE", reaction: "Réaction anaphylactoïde" }],
      medications: [
        { name: "Levothyroxine", dosage: "75µg", frequency: "1x/jour matin à jeun" },
        { name: "Atorvastatine", dosage: "40mg", frequency: "1x/jour soir" },
      ],
      histories: [
        { condition: "Hypothyroïdie", diagnosedAt: new Date("2010-02-20") },
        { condition: "Hypercholestérolémie", diagnosedAt: new Date("2012-05-10") },
      ],
    },
    {
      // 6 — Dossier EN ATTENTE
      email: "isabelle.moreau@sam.demo",
      firstName: "Isabelle",
      lastName: "Moreau",
      birthDate: new Date("1975-06-12"),
      birthCity: "Nantes",
      bloodGroup: "A+",
      allergies: [{ name: "Aspirine", severity: "MODEREE", reaction: "Douleurs abdominales, nausées" }],
    },
    {
      // 7
      email: "francois.petit@sam.demo",
      firstName: "François",
      lastName: "Petit",
      birthDate: new Date("1990-02-28"),
      birthCity: "Toulouse",
      bloodGroup: "A+",
      validatedAt: new Date("2024-01-20"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [{ name: "Gluten", severity: "LEGERE", reaction: "Troubles digestifs" }],
      histories: [{ condition: "Maladie cœliaque", diagnosedAt: new Date("2019-11-15") }],
    },
    {
      // 8
      email: "nathalie.laurent@sam.demo",
      firstName: "Nathalie",
      lastName: "Laurent",
      birthDate: new Date("1983-08-15"),
      birthCity: "Paris",
      bloodGroup: "B-",
      validatedAt: new Date("2024-02-28"),
      validatedBy: "Marie Vidal (IAO)",
      allergies: [{ name: "Pénicilline", severity: "GRAVE", reaction: "Éruption cutanée sévère, urticaire" }],
      medications: [{ name: "Lévothyroxine", dosage: "50µg", frequency: "1x/jour" }],
    },
    {
      // 9
      email: "michel.dubois@sam.demo",
      firstName: "Michel",
      lastName: "Dubois",
      birthDate: new Date("1950-12-03"),
      birthCity: "Lyon",
      bloodGroup: "O+",
      validatedAt: new Date("2024-01-10"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [],
      medications: [
        { name: "Kardégic", dosage: "75mg", frequency: "1x/jour" },
        { name: "Bisoprolol", dosage: "5mg", frequency: "1x/jour matin" },
        { name: "Ramipril", dosage: "10mg", frequency: "1x/jour" },
      ],
      histories: [
        { condition: "Cardiopathie ischémique", diagnosedAt: new Date("2005-07-15") },
        { condition: "BPCO stade 2", diagnosedAt: new Date("2018-09-20") },
      ],
      contact: { firstName: "Isabelle", lastName: "Dubois", relationship: "Épouse", phone: "06 55 44 33 22" },
      treatDoctor: "Dr. Sophie Martin",
    },
    {
      // 10 — EN ATTENTE
      email: "christine.simon@sam.demo",
      firstName: "Christine",
      lastName: "Simon",
      birthDate: new Date("1968-05-27"),
      birthCity: "Paris",
      bloodGroup: "A+",
      allergies: [{ name: "Latex", severity: "GRAVE", reaction: "Urticaire, bronchospasme" }],
    },
    {
      // 11
      email: "antoine.thomas@sam.demo",
      firstName: "Antoine",
      lastName: "Thomas",
      birthDate: new Date("2001-01-10"),
      birthCity: "Versailles",
      bloodGroup: "A+",
      validatedAt: new Date("2024-03-05"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [
        { name: "Arachides", severity: "ANAPHYLAXIE", reaction: "Choc anaphylactique" },
        { name: "Fruits à coque", severity: "GRAVE", reaction: "Urticaire, angioedème" },
      ],
      medications: [{ name: "EpiPen (adrénaline)", dosage: "0.3mg", frequency: "En cas d'urgence" }],
    },
    {
      // 12
      email: "julie.richard@sam.demo",
      firstName: "Julie",
      lastName: "Richard",
      birthDate: new Date("1995-03-22"),
      birthCity: "Saint-Cloud",
      bloodGroup: "O+",
      validatedAt: new Date("2024-02-15"),
      validatedBy: "Marie Vidal (IAO)",
      allergies: [{ name: "Sulfites", severity: "MODEREE", reaction: "Maux de tête, réactions cutanées" }],
    },
    {
      // 13
      email: "philippe.durand@sam.demo",
      firstName: "Philippe",
      lastName: "Durand",
      birthDate: new Date("1947-11-19"),
      birthCity: "Paris",
      bloodGroup: "B+",
      validatedAt: new Date("2024-01-25"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [
        { name: "Pénicilline", severity: "GRAVE", reaction: "Urticaire généralisée" },
        { name: "Morphine", severity: "MODEREE", reaction: "Nausées sévères, hypotension" },
      ],
      medications: [
        { name: "Sintrom", dosage: "variable", frequency: "1x/jour selon INR" },
        { name: "Enalapril", dosage: "5mg", frequency: "2x/jour" },
      ],
      histories: [
        { condition: "Fibrillation auriculaire", diagnosedAt: new Date("2010-04-01") },
        { condition: "Insuffisance cardiaque NYHA II", diagnosedAt: new Date("2015-08-10") },
      ],
      contact: { firstName: "Martine", lastName: "Durand", relationship: "Épouse", phone: "06 11 11 11 11" },
    },
    {
      // 14 — EN ATTENTE
      email: "sandrine.lecomte@sam.demo",
      firstName: "Sandrine",
      lastName: "Lecomte",
      birthDate: new Date("1988-07-04"),
      birthCity: "Lyon",
      bloodGroup: "A+",
      allergies: [],
    },
    {
      // 15
      email: "pascal.girard@sam.demo",
      firstName: "Pascal",
      lastName: "Girard",
      birthDate: new Date("1972-09-16"),
      birthCity: "Bordeaux",
      bloodGroup: "AB-",
      validatedAt: new Date("2024-02-10"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [{ name: "Venin d'abeille", severity: "ANAPHYLAXIE", reaction: "Choc anaphylactique" }],
      medications: [{ name: "EpiPen (adrénaline)", dosage: "0.3mg", frequency: "En cas d'urgence" }],
    },
    {
      // 16
      email: "veronique.robert@sam.demo",
      firstName: "Véronique",
      lastName: "Robert",
      birthDate: new Date("1980-04-25"),
      birthCity: "Nantes",
      bloodGroup: "O+",
      validatedAt: new Date("2024-03-01"),
      validatedBy: "Marie Vidal (IAO)",
      allergies: [],
      contact: { firstName: "Jacques", lastName: "Robert", relationship: "Époux", phone: "06 22 33 44 55" },
    },
    {
      // 17 — EN ATTENTE
      email: "david.lefebvre@sam.demo",
      firstName: "David",
      lastName: "Lefebvre",
      birthDate: new Date("2005-12-30"),
      birthCity: "Paris",
      bloodGroup: "A+",
      allergies: [{ name: "Sulfamides", severity: "GRAVE", reaction: "Syndrome de Stevens-Johnson" }],
    },
    {
      // 18
      email: "martine.bonnet@sam.demo",
      firstName: "Martine",
      lastName: "Bonnet",
      birthDate: new Date("1955-03-08"),
      birthCity: "Marseille",
      bloodGroup: "B+",
      validatedAt: new Date("2024-01-18"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [],
      medications: [
        { name: "Methotrexate", dosage: "10mg", frequency: "1x/semaine" },
        { name: "Acide folique", dosage: "5mg", frequency: "1x/semaine" },
      ],
      histories: [{ condition: "Polyarthrite rhumatoïde", diagnosedAt: new Date("2009-05-20") }],
    },
    {
      // 19
      email: "eric.faure@sam.demo",
      firstName: "Éric",
      lastName: "Faure",
      birthDate: new Date("1969-10-11"),
      birthCity: "Paris",
      bloodGroup: "A+",
      validatedAt: new Date("2024-02-22"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [{ name: "Aspirine", severity: "MODEREE", reaction: "Gastralgie, ulcère gastro-duodénal" }],
      medications: [{ name: "Oméprazole", dosage: "20mg", frequency: "1x/jour" }],
    },
    {
      // 20 — EN ATTENTE
      email: "celine.rousseau@sam.demo",
      firstName: "Céline",
      lastName: "Rousseau",
      birthDate: new Date("1998-06-17"),
      birthCity: "Toulouse",
      bloodGroup: "O+",
      allergies: [{ name: "Latex", severity: "MODEREE", reaction: "Dermatite de contact" }],
    },
    {
      // 21
      email: "olivier.blanc@sam.demo",
      firstName: "Olivier",
      lastName: "Blanc",
      birthDate: new Date("1985-02-20"),
      birthCity: "Lyon",
      bloodGroup: "A+",
      validatedAt: new Date("2024-03-15"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [],
    },
    {
      // 22
      email: "patricia.guerin@sam.demo",
      firstName: "Patricia",
      lastName: "Guérin",
      birthDate: new Date("1963-08-30"),
      birthCity: "Paris",
      bloodGroup: "AB+",
      validatedAt: new Date("2024-01-28"),
      validatedBy: "Marie Vidal (IAO)",
      allergies: [
        { name: "Pénicilline", severity: "GRAVE", reaction: "Éruption sévère, œdème" },
        { name: "Ibuprofène", severity: "GRAVE", reaction: "Bronchospasme, urticaire" },
      ],
      medications: [{ name: "Cordarone", dosage: "200mg", frequency: "1x/jour" }],
      histories: [{ condition: "Fibrillation auriculaire", diagnosedAt: new Date("2018-02-14") }],
    },
    {
      // 23
      email: "bruno.chevalier@sam.demo",
      firstName: "Bruno",
      lastName: "Chevalier",
      birthDate: new Date("1978-04-05"),
      birthCity: "Paris",
      bloodGroup: "O+",
      validatedAt: new Date("2024-02-08"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [],
      contact: { firstName: "Anne", lastName: "Chevalier", relationship: "Épouse", phone: "06 44 55 66 77" },
    },
    {
      // 24
      email: "monique.faure@sam.demo",
      firstName: "Monique",
      lastName: "Faure",
      birthDate: new Date("1944-01-15"),
      birthCity: "Versailles",
      bloodGroup: "B+",
      validatedAt: new Date("2024-01-05"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [],
      medications: [
        { name: "Kardégic", dosage: "75mg", frequency: "1x/jour" },
        { name: "Bisoprolol", dosage: "2.5mg", frequency: "1x/jour" },
      ],
      histories: [{ condition: "Maladie d'Alzheimer légère", diagnosedAt: new Date("2022-09-10") }],
      contact: { firstName: "Robert", lastName: "Faure", relationship: "Fils", phone: "06 77 88 99 00" },
    },
    {
      // 25
      email: "laurent.garnier@sam.demo",
      firstName: "Laurent",
      lastName: "Garnier",
      birthDate: new Date("1990-11-28"),
      birthCity: "Paris",
      bloodGroup: "A+",
      validatedAt: new Date("2024-03-20"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [{ name: "Pénicilline", severity: "ANAPHYLAXIE", reaction: "Choc anaphylactique documenté" }],
      medications: [{ name: "EpiPen (adrénaline)", dosage: "0.3mg", frequency: "En cas d'urgence" }],
    },
    {
      // 26 — EN ATTENTE
      email: "chantal.lemaire@sam.demo",
      firstName: "Chantal",
      lastName: "Lemaire",
      birthDate: new Date("1958-07-23"),
      birthCity: "Lyon",
      bloodGroup: "O+",
      allergies: [{ name: "Lactose", severity: "LEGERE", reaction: "Troubles digestifs" }],
    },
    {
      // 27
      email: "stephane.renard@sam.demo",
      firstName: "Stéphane",
      lastName: "Renard",
      birthDate: new Date("1987-05-16"),
      birthCity: "Bordeaux",
      bloodGroup: "A+",
      validatedAt: new Date("2024-02-25"),
      validatedBy: "Marie Vidal (IAO)",
      allergies: [],
    },
    {
      // 28 — EN ATTENTE
      email: "helene.collin@sam.demo",
      firstName: "Hélène",
      lastName: "Collin",
      birthDate: new Date("2000-09-01"),
      birthCity: "Paris",
      bloodGroup: "A+",
      allergies: [],
    },
    {
      // 29
      email: "claude.morel@sam.demo",
      firstName: "Claude",
      lastName: "Morel",
      birthDate: new Date("1952-03-14"),
      birthCity: "Paris",
      bloodGroup: "AB+",
      validatedAt: new Date("2024-01-22"),
      validatedBy: "Claire Rousseau (IAO)",
      allergies: [{ name: "Warfarine", severity: "GRAVE", reaction: "Saignements sévères, thrombopénie" }],
      medications: [{ name: "Xarelto (rivaroxaban)", dosage: "20mg", frequency: "1x/jour avec repas" }],
      histories: [{ condition: "Embolie pulmonaire (2021)", diagnosedAt: new Date("2021-04-15") }],
    },
    {
      // 30 — EN ATTENTE + HOMONYME Dupont
      email: "lucie.dupont@sam.demo",
      firstName: "Lucie",
      lastName: "Dupont",
      birthDate: new Date("2003-06-20"),
      birthCity: "Versailles",
      bloodGroup: "O+",
      allergies: [],
    },
  ]

  const createdPatients: Array<{ id: string; email: string }> = []

  for (const p of patients) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash,
        role: "PATIENT",
        patient: {
          create: {
            firstName: p.firstName,
            lastName: p.lastName,
            birthDate: p.birthDate,
            birthCity: p.birthCity,
            bloodGroup: p.bloodGroup,
            qrCode: randomUUID(),
            validatedAt: p.validatedAt,
            validatedBy: p.validatedBy,
            record: {
              create: {
                treatingDoctor: p.treatDoctor,
                allergies: p.allergies && p.allergies.length > 0
                  ? { createMany: { data: p.allergies } }
                  : undefined,
                medications: p.medications && p.medications.length > 0
                  ? { createMany: { data: p.medications } }
                  : undefined,
                medicalHistories: p.histories && p.histories.length > 0
                  ? { createMany: { data: p.histories } }
                  : undefined,
                emergencyContact: p.contact
                  ? { create: p.contact }
                  : undefined,
              },
            },
          },
        },
      },
      include: { patient: true },
    })
    createdPatients.push({ id: user.patient!.id, email: p.email })
  }

  console.log(`✓ ${patients.length} patients créés`)

  // ───────────────── PASSAGES (interopérabilité) ─────────────────
  const jeanDupont = createdPatients.find((p) => p.email === "jean.dupont@sam.demo")
  const michelDubois = createdPatients.find((p) => p.email === "michel.dubois@sam.demo")
  const sophieBernard = createdPatients.find((p) => p.email === "sophie.bernard@sam.demo")
  const philippeDurand = createdPatients.find((p) => p.email === "philippe.durand@sam.demo")

  if (jeanDupont) {
    await prisma.visit.createMany({
      data: [
        {
          patientId: jeanDupont.id,
          hospitalId: versailles.id,
          date: new Date("2024-01-15"),
          reason: "Consultation diabétologie de suivi",
          notes: "Glycémie équilibrée, HbA1c 7.2%",
        },
        {
          patientId: jeanDupont.id,
          hospitalId: saintCloud.id,
          date: new Date("2024-03-01"),
          reason: "Urgences — douleur thoracique",
          notes: "Bilan cardiologique négatif. Rappel allergie Pénicilline consigné.",
        },
      ],
    })
  }

  if (michelDubois) {
    await prisma.visit.createMany({
      data: [
        {
          patientId: michelDubois.id,
          hospitalId: versailles.id,
          date: new Date("2024-01-10"),
          reason: "Suivi cardiologique",
        },
        {
          patientId: michelDubois.id,
          hospitalId: saintCloud.id,
          date: new Date("2024-01-20"),
          reason: "Radiographie thoracique",
          notes: "Résultats transmis au cardiologue référent",
        },
      ],
    })
  }

  if (sophieBernard) {
    await prisma.visit.create({
      data: {
        patientId: sophieBernard.id,
        hospitalId: saintCloud.id,
        date: new Date("2024-03-10"),
        reason: "Consultation allergologie",
        notes: "Désensibilisation en cours",
      },
    })
  }

  if (philippeDurand) {
    await prisma.visit.createMany({
      data: [
        {
          patientId: philippeDurand.id,
          hospitalId: versailles.id,
          date: new Date("2024-01-25"),
          reason: "Urgences — décompensation cardiaque",
          notes: "Hospitalisation 3 jours. Sortie avec renforcement du traitement.",
        },
        {
          patientId: philippeDurand.id,
          hospitalId: saintCloud.id,
          date: new Date("2024-02-15"),
          reason: "Suivi post-hospitalisation",
        },
      ],
    })
  }

  console.log("✓ Passages créés (interopérabilité démontrée)")

  // ───────────────── AUDIT LOG DE DÉMONSTRATION ─────────────────
  const urgentisteUser = await prisma.user.findUnique({
    where: { email: "urgentiste.versailles@sam.demo" },
    include: { staff: true },
  })

  if (urgentisteUser && jeanDupont) {
    await prisma.auditLog.create({
      data: {
        userId: urgentisteUser.id,
        staffId: urgentisteUser.staff?.id,
        patientId: jeanDupont.id,
        action: "EMERGENCY_ACCESS",
        details: JSON.stringify({
          justification: "Patient retrouvé inconscient aux urgences. Identification par carte vitale. Accès d'urgence nécessaire.",
        }),
        isEmergency: true,
        createdAt: new Date("2024-03-01T22:35:00"),
      },
    })
  }

  console.log("✓ Audit log de démonstration créé")

  console.log("\n🎉 Seed terminé avec succès !")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("Comptes de démonstration (mot de passe : demo1234)")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("URGENTISTE : urgentiste.versailles@sam.demo")
  console.log("IAO        : iao.versailles@sam.demo")
  console.log("ACCUEIL    : accueil.versailles@sam.demo")
  console.log("ADMIN      : admin.versailles@sam.demo")
  console.log("PATIENT    : jean.dupont@sam.demo")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

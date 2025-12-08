import { Person, User, Gender } from '../types';

// QUESTO FILE SIMULA IL DATABASE CONDIVISO
// Aggiornato con i dati forniti dall'utente (Export JSON)

export const INITIAL_USERS: User[] = [];

// Utilizziamo 'as any' o 'as unknown as Person[]' per evitare conflitti di tipo tra stringhe JSON ("M") e Enum TypeScript (Gender.Male)
export const INITIAL_PEOPLE: Person[] = [
  {
    "id": "@I1@",
    "firstName": "Cosimo Antonio (Dino)",
    "lastName": "Resta",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "20 OCT 1933",
    "birthPlace": "",
    "deathDate": "22 DEC 2015",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I2@"
    ],
    "childrenIds": [
      "@I5@",
      "@I3@",
      "@I4@"
    ],
    "fatherId": "@I12@",
    "motherId": "@I13@"
  },
  {
    "id": "@I2@",
    "firstName": "Antonietta Maria Caterina Fortunata",
    "lastName": "Murri",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "18 JAN 1938",
    "birthPlace": "",
    "deathDate": "30 JUN 2021",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I1@"
    ],
    "childrenIds": [
      "@I5@",
      "@I3@",
      "@I4@"
    ],
    "fatherId": "@I29@",
    "motherId": "@I30@"
  },
  {
    "id": "@I3@",
    "firstName": "Luigi",
    "lastName": "Resta",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "28 MAY 1965",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I7@"
    ],
    "childrenIds": [
      "@I6@",
      "@I8@"
    ],
    "fatherId": "@I1@",
    "motherId": "@I2@"
  },
  {
    "id": "@I4@",
    "firstName": "Mauro",
    "lastName": "Resta",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "20 JUN 1968",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I33@"
    ],
    "childrenIds": [
      "@I34@",
      "@I35@"
    ],
    "fatherId": "@I1@",
    "motherId": "@I2@"
  },
  {
    "id": "@I5@",
    "firstName": "Maria Simonetta",
    "lastName": "RESTA",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "11 SEP 1963",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I9@"
    ],
    "childrenIds": [
      "@I10@",
      "@I11@"
    ],
    "fatherId": "@I1@",
    "motherId": "@I2@"
  },
  {
    "id": "@I6@",
    "firstName": "Rebecca",
    "lastName": "Resta",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "2 JAN 2007",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I3@",
    "motherId": "@I7@"
  },
  {
    "id": "@I7@",
    "firstName": "Angelita",
    "lastName": "Bruno",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "19 NOV 1973",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I3@"
    ],
    "childrenIds": [
      "@I6@",
      "@I8@"
    ],
    "fatherId": "@I50@",
    "motherId": "@I51@"
  },
  {
    "id": "@I8@",
    "firstName": "Greta",
    "lastName": "Resta",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "12 JUN 2010",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I3@",
    "motherId": "@I7@"
  },
  {
    "id": "@I9@",
    "firstName": "Bruno",
    "lastName": "FOURNET",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "17 AUG 1969",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I5@"
    ],
    "childrenIds": [
      "@I10@",
      "@I11@"
    ],
    "fatherId": "@I500080@",
    "motherId": "@I500077@"
  },
  {
    "id": "@I10@",
    "firstName": "Alexis",
    "lastName": "FOURNET",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "18 MAR 2003",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I9@",
    "motherId": "@I5@"
  },
  {
    "id": "@I11@",
    "firstName": "William",
    "lastName": "FOURNET",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "22 DEC 2006",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I9@",
    "motherId": "@I5@"
  },
  {
    "id": "@I12@",
    "firstName": "Luigi",
    "lastName": "Resta",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "10 MAY 1910",
    "birthPlace": "",
    "deathDate": "3 MAR 1985",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I13@"
    ],
    "childrenIds": [
      "@I14@",
      "@I1@",
      "@I15@",
      "@I27@"
    ],
    "fatherId": "@I500076@"
  },
  {
    "id": "@I13@",
    "firstName": "Jolanda",
    "lastName": "FRANCONE",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "2 MAY 1902",
    "birthPlace": "",
    "deathDate": "2 MAY 1902",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I12@"
    ],
    "childrenIds": [
      "@I14@",
      "@I1@",
      "@I15@",
      "@I27@"
    ]
  },
  {
    "id": "@I14@",
    "firstName": "Maria Olga",
    "lastName": "RESTA",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "17 MAR 1931",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I16@"
    ],
    "childrenIds": [
      "@I17@"
    ],
    "fatherId": "@I12@",
    "motherId": "@I13@"
  },
  {
    "id": "@I15@",
    "firstName": "Maria Rossana",
    "lastName": "RESTA",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1 JAN 1936",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I21@"
    ],
    "childrenIds": [
      "@I22@"
    ],
    "fatherId": "@I12@",
    "motherId": "@I13@"
  },
  {
    "id": "@I16@",
    "firstName": "Lu CICI",
    "lastName": "CHIRENTI",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "26 AUG 1928",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I14@"
    ],
    "childrenIds": [
      "@I17@"
    ]
  },
  {
    "id": "@I17@",
    "firstName": "Paolo",
    "lastName": "CHIRENTI",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1 OCT 1955",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I18@"
    ],
    "childrenIds": [
      "@I19@",
      "@I20@"
    ],
    "fatherId": "@I16@",
    "motherId": "@I14@"
  },
  {
    "id": "@I18@",
    "firstName": "Alina",
    "lastName": "PIERRO",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "4 OCT 1966",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I17@"
    ],
    "childrenIds": [
      "@I19@",
      "@I20@"
    ]
  },
  {
    "id": "@I19@",
    "firstName": "Luigi",
    "lastName": "CHIRENTI",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "4 OCT 1997",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I17@",
    "motherId": "@I18@"
  },
  {
    "id": "@I20@",
    "firstName": "Fulvia",
    "lastName": "CHIRENTI",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I17@",
    "motherId": "@I18@"
  },
  {
    "id": "@I21@",
    "firstName": "Antonio (Uccio)",
    "lastName": "MATTEO",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "2002",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I15@"
    ],
    "childrenIds": []
  },
  {
    "id": "@I22@",
    "firstName": "Antonella",
    "lastName": "MATTEO",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "17 FEB 1980",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I24@"
    ],
    "childrenIds": [
      "@I25@"
    ],
    "motherId": "@I15@"
  },
  {
    "id": "@I23@",
    "firstName": "Padre di Antonella",
    "lastName": "MATTEO",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I26@"
    ],
    "childrenIds": []
  },
  {
    "id": "@I24@",
    "firstName": "Maurizio",
    "lastName": "MIGLIACCIO",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I22@"
    ],
    "childrenIds": [
      "@I25@"
    ]
  },
  {
    "id": "@I25@",
    "firstName": "Enrico",
    "lastName": "MIGLIACCIO",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I24@",
    "motherId": "@I22@"
  },
  {
    "id": "@I26@",
    "firstName": "Madre vera",
    "lastName": "naturale",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I23@"
    ],
    "childrenIds": []
  },
  {
    "id": "@I27@",
    "firstName": "Maria Liliana",
    "lastName": "RESTA",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "20 MAR 1938",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I28@"
    ],
    "childrenIds": [],
    "fatherId": "@I12@",
    "motherId": "@I13@"
  },
  {
    "id": "@I28@",
    "firstName": "Antonio",
    "lastName": "MINERBA",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "17 APR 1938",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I27@"
    ],
    "childrenIds": []
  },
  {
    "id": "@I29@",
    "firstName": "Simone Francesco Emilio",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "21 JAN 1900",
    "birthPlace": "",
    "deathDate": "27 DEC 1984",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I30@"
    ],
    "childrenIds": [
      "@I31@",
      "@I2@"
    ],
    "fatherId": "@I45@",
    "motherId": "@I46@"
  },
  {
    "id": "@I30@",
    "firstName": "Mary",
    "lastName": "ASTESIANO",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "27 JAN 1906",
    "birthPlace": "",
    "deathDate": "27 JAN 1906",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I29@"
    ],
    "childrenIds": [
      "@I31@",
      "@I2@"
    ],
    "fatherId": "@I500067@",
    "motherId": "@I500075@"
  },
  {
    "id": "@I31@",
    "firstName": "Anna Carmela",
    "lastName": "Murri",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "3 FEB 1933",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I32@"
    ],
    "childrenIds": [
      "@I36@",
      "@I37@",
      "@I38@"
    ],
    "fatherId": "@I29@",
    "motherId": "@I30@"
  },
  {
    "id": "@I32@",
    "firstName": "Luigi",
    "lastName": "CARLIZZA",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1933",
    "birthPlace": "",
    "deathDate": "1993",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I31@"
    ],
    "childrenIds": [
      "@I36@",
      "@I37@",
      "@I38@"
    ]
  },
  {
    "id": "@I33@",
    "firstName": "Antonella",
    "lastName": "MORENO",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I4@"
    ],
    "childrenIds": [
      "@I34@",
      "@I35@"
    ]
  },
  {
    "id": "@I34@",
    "firstName": "Daniele",
    "lastName": "Resta",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "29 JUL 2007",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I4@",
    "motherId": "@I33@"
  },
  {
    "id": "@I35@",
    "firstName": "Ginevra",
    "lastName": "Resta",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "19 AUG 2011",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I4@",
    "motherId": "@I33@"
  },
  {
    "id": "@I36@",
    "firstName": "Francesco",
    "lastName": "CARLIZZA",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "4 JUN 1963",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I39@"
    ],
    "childrenIds": [
      "@I40@",
      "@I41@"
    ],
    "fatherId": "@I32@",
    "motherId": "@I31@"
  },
  {
    "id": "@I37@",
    "firstName": "Simone",
    "lastName": "CARLIZZA",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1964",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I42@"
    ],
    "childrenIds": [
      "@I43@"
    ],
    "fatherId": "@I32@",
    "motherId": "@I31@"
  },
  {
    "id": "@I38@",
    "firstName": "Maria Albena",
    "lastName": "CARLIZZA",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1 SEP 1967",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I44@"
    ],
    "childrenIds": [],
    "fatherId": "@I32@",
    "motherId": "@I31@"
  },
  {
    "id": "@I39@",
    "firstName": "Anta",
    "lastName": "",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I36@"
    ],
    "childrenIds": [
      "@I40@",
      "@I41@"
    ]
  },
  {
    "id": "@I40@",
    "firstName": "Anna",
    "lastName": "CARLIZZA",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I36@",
    "motherId": "@I39@"
  },
  {
    "id": "@I41@",
    "firstName": "Egle",
    "lastName": "CARLIZZA",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I36@",
    "motherId": "@I39@"
  },
  {
    "id": "@I42@",
    "firstName": "Sabrina",
    "lastName": "",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I37@"
    ],
    "childrenIds": [
      "@I43@"
    ]
  },
  {
    "id": "@I43@",
    "firstName": "Claudia",
    "lastName": "CARLIZZA",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "24 NOV 2006",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I37@",
    "motherId": "@I42@"
  },
  {
    "id": "@I44@",
    "firstName": "Andrea",
    "lastName": "CAPASSO",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I38@"
    ],
    "childrenIds": []
  },
  {
    "id": "@I45@",
    "firstName": "Aniceto",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I46@"
    ],
    "childrenIds": [
      "@I29@",
      "@I47@",
      "@I48@"
    ],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I46@",
    "firstName": "Carmela",
    "lastName": "SPAGNOLO",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "23 DEC 1877",
    "birthPlace": "",
    "deathDate": "23 DEC 1877",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I45@"
    ],
    "childrenIds": [
      "@I29@",
      "@I47@",
      "@I48@"
    ],
    "fatherId": "@I500035@",
    "motherId": "@I500036@"
  },
  {
    "id": "@I47@",
    "firstName": "Astolfo",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I45@",
    "motherId": "@I46@"
  },
  {
    "id": "@I48@",
    "firstName": "Ubaldo",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500107@"
    ],
    "childrenIds": [
      "@I500108@"
    ],
    "fatherId": "@I45@",
    "motherId": "@I46@"
  },
  {
    "id": "@I50@",
    "firstName": "Giuseppe",
    "lastName": "Bruno",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "6 JAN 1938",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I51@"
    ],
    "childrenIds": [
      "@I52@",
      "@I7@"
    ]
  },
  {
    "id": "@I51@",
    "firstName": "Maria",
    "lastName": "Lapadula",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I50@"
    ],
    "childrenIds": [
      "@I52@",
      "@I7@"
    ]
  },
  {
    "id": "@I52@",
    "firstName": "Michele",
    "lastName": "Bruno",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "5 JAN 1966",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I53@"
    ],
    "childrenIds": [
      "@I54@"
    ],
    "fatherId": "@I50@",
    "motherId": "@I51@"
  },
  {
    "id": "@I53@",
    "firstName": "Sabrina",
    "lastName": "Corazza",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I52@"
    ],
    "childrenIds": [
      "@I54@"
    ]
  },
  {
    "id": "@I54@",
    "firstName": "Martina",
    "lastName": "Bruno",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I52@",
    "motherId": "@I53@"
  },
  {
    "id": "@I500001@",
    "firstName": "Simone Carmelo",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "10 FEB 1831",
    "birthPlace": "",
    "deathDate": "15 DEC 1900",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500002@"
    ],
    "childrenIds": [
      "@I500004@",
      "@I500005@",
      "@I500006@",
      "@I500003@",
      "@I500017@",
      "@I500018@",
      "@I500019@",
      "@I500020@",
      "@I500021@",
      "@I45@"
    ]
  },
  {
    "id": "@I500002@",
    "firstName": "Maria Cleofe",
    "lastName": "Cavaliere",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "19 JAN 1840",
    "birthPlace": "",
    "deathDate": "27 MAY 1914",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500001@"
    ],
    "childrenIds": [
      "@I500004@",
      "@I500005@",
      "@I500006@",
      "@I500003@",
      "@I500017@",
      "@I500018@",
      "@I500019@",
      "@I500020@",
      "@I500021@",
      "@I45@"
    ]
  },
  {
    "id": "@I500003@",
    "firstName": "Francesco Luigi",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "9 MAR 1867",
    "birthPlace": "",
    "deathDate": "28 AUG 1946",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500004@",
    "firstName": "Vittoria Rachele",
    "lastName": "Murri",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "24 JAN 1861",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500005@",
    "firstName": "Maria Concetta Carmela",
    "lastName": "Murri",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "24 JAN 1861",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500006@",
    "firstName": "Saveria Maria",
    "lastName": "Murri",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "24 SEP 1862",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500007@"
    ],
    "childrenIds": [
      "@I500008@",
      "@I500014@",
      "@I500015@",
      "@I500016@"
    ],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500007@",
    "firstName": "Giovanni",
    "lastName": "Longo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "25 NOV 1890",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500006@"
    ],
    "childrenIds": [
      "@I500008@",
      "@I500014@",
      "@I500015@",
      "@I500016@"
    ]
  },
  {
    "id": "@I500008@",
    "firstName": "Simone",
    "lastName": "Longo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500009@"
    ],
    "childrenIds": [
      "@I500010@",
      "@I500011@",
      "@I500012@",
      "@I500013@"
    ],
    "fatherId": "@I500007@",
    "motherId": "@I500006@"
  },
  {
    "id": "@I500009@",
    "firstName": "Anita",
    "lastName": "Abadessa",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500008@"
    ],
    "childrenIds": [
      "@I500010@",
      "@I500011@",
      "@I500012@",
      "@I500013@"
    ]
  },
  {
    "id": "@I500010@",
    "firstName": "Giovanni",
    "lastName": "Longo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500008@",
    "motherId": "@I500009@"
  },
  {
    "id": "@I500011@",
    "firstName": "Antonello",
    "lastName": "Longo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500008@",
    "motherId": "@I500009@"
  },
  {
    "id": "@I500012@",
    "firstName": "Maria",
    "lastName": "Longo",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500008@",
    "motherId": "@I500009@"
  },
  {
    "id": "@I500013@",
    "firstName": "Luisa",
    "lastName": "Longo",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500008@",
    "motherId": "@I500009@"
  },
  {
    "id": "@I500014@",
    "firstName": "Rosina",
    "lastName": "Longo",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500007@",
    "motherId": "@I500006@"
  },
  {
    "id": "@I500015@",
    "firstName": "Giuseppe",
    "lastName": "Longo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500007@",
    "motherId": "@I500006@"
  },
  {
    "id": "@I500016@",
    "firstName": "Rodolfo",
    "lastName": "Longo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500007@",
    "motherId": "@I500006@"
  },
  {
    "id": "@I500017@",
    "firstName": "Silvio",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "29 JUN 1869",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500018@",
    "firstName": "Fiorentino Francesco Germano",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "19 OCT 1871",
    "birthPlace": "",
    "deathDate": "25 OCT 1946",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500019@",
    "firstName": "Silvio Secondo",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "12 NOV 1873",
    "birthPlace": "",
    "deathDate": "10 JAN 1940",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500020@",
    "firstName": "Carolina Giovanna Rosa",
    "lastName": "Murri",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "8 SEP 1877",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500021@",
    "firstName": "Vittoria Giulia Vincenza",
    "lastName": "Murri",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "5 FEB 1880",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500022@"
    ],
    "childrenIds": [
      "@I500023@",
      "@I500024@",
      "@I500025@",
      "@I500028@"
    ],
    "fatherId": "@I500001@",
    "motherId": "@I500002@"
  },
  {
    "id": "@I500022@",
    "firstName": "Vincenzo De",
    "lastName": "Marco",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "23 JUN 1907",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500021@"
    ],
    "childrenIds": [
      "@I500023@",
      "@I500024@",
      "@I500025@",
      "@I500028@"
    ]
  },
  {
    "id": "@I500023@",
    "firstName": "Piero De",
    "lastName": "Marco",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500022@",
    "motherId": "@I500021@"
  },
  {
    "id": "@I500024@",
    "firstName": "Nicola De",
    "lastName": "Marco",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500030@"
    ],
    "childrenIds": [
      "@I500031@",
      "@I500032@",
      "@I500033@"
    ],
    "fatherId": "@I500022@",
    "motherId": "@I500021@"
  },
  {
    "id": "@I500025@",
    "firstName": "Maria De",
    "lastName": "Marco",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500026@"
    ],
    "childrenIds": [
      "@I500027@"
    ],
    "fatherId": "@I500022@",
    "motherId": "@I500021@"
  },
  {
    "id": "@I500026@",
    "firstName": "Sconosciuto",
    "lastName": "Vallone",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500025@"
    ],
    "childrenIds": [
      "@I500027@"
    ]
  },
  {
    "id": "@I500027@",
    "firstName": "Vittoria",
    "lastName": "Vallone",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500026@",
    "motherId": "@I500025@"
  },
  {
    "id": "@I500028@",
    "firstName": "? De",
    "lastName": "Marco",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500029@"
    ],
    "childrenIds": [],
    "fatherId": "@I500022@",
    "motherId": "@I500021@"
  },
  {
    "id": "@I500029@",
    "firstName": "Paolo",
    "lastName": "Bianco",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500028@"
    ],
    "childrenIds": []
  },
  {
    "id": "@I500030@",
    "firstName": "Sconosciuto",
    "lastName": "Carissimo",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500024@"
    ],
    "childrenIds": [
      "@I500031@",
      "@I500032@",
      "@I500033@"
    ]
  },
  {
    "id": "@I500031@",
    "firstName": "Vincenzo De",
    "lastName": "Marco",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500024@",
    "motherId": "@I500030@"
  },
  {
    "id": "@I500032@",
    "firstName": "Maurizio De",
    "lastName": "Marco",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500024@",
    "motherId": "@I500030@"
  },
  {
    "id": "@I500033@",
    "firstName": "Massimo De",
    "lastName": "Marco",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500024@",
    "motherId": "@I500030@"
  },
  {
    "id": "@I500034@",
    "firstName": "Emanuele",
    "lastName": "Spagnolo",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "28 MAY 1881",
    "birthPlace": "",
    "deathDate": "16 NOV 1972",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500038@"
    ],
    "childrenIds": [
      "@I500037@",
      "@I500053@",
      "@I500041@"
    ],
    "fatherId": "@I500035@",
    "motherId": "@I500036@"
  },
  {
    "id": "@I500035@",
    "firstName": "Angelo Antonio",
    "lastName": "SPAGNOLO",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "16 AUG 1833",
    "birthPlace": "",
    "deathDate": "30 DEC 1917",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500036@"
    ],
    "childrenIds": [
      "@I46@",
      "@I500048@",
      "@I500034@",
      "@I500049@",
      "@I500050@"
    ],
    "fatherId": "@I500046@",
    "motherId": "@I500047@"
  },
  {
    "id": "@I500036@",
    "firstName": "Angela De",
    "lastName": "Francesco",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500035@"
    ],
    "childrenIds": [
      "@I46@",
      "@I500048@",
      "@I500034@",
      "@I500049@",
      "@I500050@"
    ]
  },
  {
    "id": "@I500037@",
    "firstName": "Angiolo",
    "lastName": "Spagnolo",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "27 JUL 1911",
    "birthPlace": "",
    "deathDate": "2 JUN 2008",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500040@"
    ],
    "childrenIds": [
      "@I500051@",
      "@I500052@",
      "@I500039@"
    ],
    "fatherId": "@I500034@",
    "motherId": "@I500038@"
  },
  {
    "id": "@I500038@",
    "firstName": "Giacomina De",
    "lastName": "Simone",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1 JAN 1885",
    "birthPlace": "",
    "deathDate": "27 MAY 1958",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500034@"
    ],
    "childrenIds": [
      "@I500037@",
      "@I500053@",
      "@I500041@"
    ],
    "fatherId": "@I500057@",
    "motherId": "@I500058@"
  },
  {
    "id": "@I500039@",
    "firstName": "Bruno",
    "lastName": "Spagnolo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "27 AUG 1955",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500037@",
    "motherId": "@I500040@"
  },
  {
    "id": "@I500040@",
    "firstName": "Giustina",
    "lastName": "Colonna",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "29 DEC 1919",
    "birthPlace": "",
    "deathDate": "24 AUG 2009",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500037@"
    ],
    "childrenIds": [
      "@I500051@",
      "@I500052@",
      "@I500039@"
    ],
    "fatherId": "@I500055@",
    "motherId": "@I500056@"
  },
  {
    "id": "@I500041@",
    "firstName": "Adriana",
    "lastName": "Spagnolo",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500042@"
    ],
    "childrenIds": [
      "@I500043@",
      "@I500109@"
    ],
    "fatherId": "@I500034@",
    "motherId": "@I500038@"
  },
  {
    "id": "@I500042@",
    "firstName": "Domenico",
    "lastName": "Narducci",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500041@"
    ],
    "childrenIds": [
      "@I500043@",
      "@I500109@"
    ],
    "fatherId": "@I500061@",
    "motherId": "@I500062@"
  },
  {
    "id": "@I500043@",
    "firstName": "Marilù",
    "lastName": "Narducci",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "8 JUN 1940",
    "birthPlace": "",
    "deathDate": "28 FEB 2007",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500045@"
    ],
    "childrenIds": [
      "@I500044@"
    ],
    "fatherId": "@I500042@",
    "motherId": "@I500041@"
  },
  {
    "id": "@I500044@",
    "firstName": "Giovanni",
    "lastName": "Moschettini",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500045@",
    "motherId": "@I500043@"
  },
  {
    "id": "@I500045@",
    "firstName": "Francesco",
    "lastName": "Moschettini",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "17 SEP 1933",
    "birthPlace": "",
    "deathDate": "2 JUL 1987",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500043@"
    ],
    "childrenIds": [
      "@I500044@"
    ],
    "fatherId": "@I500087@",
    "motherId": "@I500088@"
  },
  {
    "id": "@I500046@",
    "firstName": "Romualdo",
    "lastName": "SPAGNOLO",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1800",
    "birthPlace": "",
    "deathDate": "20 NOV 1869",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500047@"
    ],
    "childrenIds": [
      "@I500035@"
    ]
  },
  {
    "id": "@I500047@",
    "firstName": "Teresa",
    "lastName": "Gravile",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500046@"
    ],
    "childrenIds": [
      "@I500035@"
    ]
  },
  {
    "id": "@I500048@",
    "firstName": "Emmanuela",
    "lastName": "SPAGNOLO",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1879",
    "birthPlace": "",
    "deathDate": "1968",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500035@",
    "motherId": "@I500036@"
  },
  {
    "id": "@I500049@",
    "firstName": "Antonio",
    "lastName": "SPAGNOLO",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1883",
    "birthPlace": "",
    "deathDate": "1887",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500035@",
    "motherId": "@I500036@"
  },
  {
    "id": "@I500050@",
    "firstName": "Maria Teresa",
    "lastName": "SPAGNOLO",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1886",
    "birthPlace": "",
    "deathDate": "1946",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500035@",
    "motherId": "@I500036@"
  },
  {
    "id": "@I500051@",
    "firstName": "Emanuele",
    "lastName": "Spagnolo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "15 MAR 1946",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500037@",
    "motherId": "@I500040@"
  },
  {
    "id": "@I500052@",
    "firstName": "Paolo",
    "lastName": "Spagnolo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "27 AUG 1953",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500037@",
    "motherId": "@I500040@"
  },
  {
    "id": "@I500053@",
    "firstName": "Valerio",
    "lastName": "Spagnolo",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1912",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500054@"
    ],
    "childrenIds": [],
    "fatherId": "@I500034@",
    "motherId": "@I500038@"
  },
  {
    "id": "@I500054@",
    "firstName": "Regina",
    "lastName": "Dell'Aglio",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500053@"
    ],
    "childrenIds": [],
    "fatherId": "@I500059@",
    "motherId": "@I500060@"
  },
  {
    "id": "@I500055@",
    "firstName": "Francesco",
    "lastName": "Colonna",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500056@"
    ],
    "childrenIds": [
      "@I500040@"
    ]
  },
  {
    "id": "@I500056@",
    "firstName": "Serafina",
    "lastName": "Scorcia",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500055@"
    ],
    "childrenIds": [
      "@I500040@"
    ]
  },
  {
    "id": "@I500057@",
    "firstName": "Francesco de",
    "lastName": "Simone",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "24 DEC 2019",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500058@"
    ],
    "childrenIds": [
      "@I500038@"
    ]
  },
  {
    "id": "@I500058@",
    "firstName": "Giuseppina de",
    "lastName": "Dominicis",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "24 DEC 2019",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500057@"
    ],
    "childrenIds": [
      "@I500038@"
    ]
  },
  {
    "id": "@I500059@",
    "firstName": "Luigi Lorenzo",
    "lastName": "Dell'aglio",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "5 FEB 1881",
    "birthPlace": "",
    "deathDate": "23 FEB 1938",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500060@"
    ],
    "childrenIds": [
      "@I500054@"
    ]
  },
  {
    "id": "@I500060@",
    "firstName": "Elvira De",
    "lastName": "Simone",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "10 MAY 1890",
    "birthPlace": "",
    "deathDate": "10 NOV 1963",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500059@"
    ],
    "childrenIds": [
      "@I500054@"
    ]
  },
  {
    "id": "@I500061@",
    "firstName": "Vito Oronzo",
    "lastName": "Narducci",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "24 DEC 2019",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500062@"
    ],
    "childrenIds": [
      "@I500042@"
    ],
    "fatherId": "@I500063@",
    "motherId": "@I500064@"
  },
  {
    "id": "@I500062@",
    "firstName": "Rita",
    "lastName": "Luparelli",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "24 DEC 2019",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500061@"
    ],
    "childrenIds": [
      "@I500042@"
    ],
    "fatherId": "@I500065@",
    "motherId": "@I500066@"
  },
  {
    "id": "@I500063@",
    "firstName": "ddf",
    "lastName": "Narducci",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "24 DEC 2019",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500064@"
    ],
    "childrenIds": [
      "@I500061@"
    ]
  },
  {
    "id": "@I500064@",
    "firstName": "ddf",
    "lastName": "Narducci",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "24 DEC 2019",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500063@"
    ],
    "childrenIds": [
      "@I500061@"
    ]
  },
  {
    "id": "@I500065@",
    "firstName": "ddf",
    "lastName": "Luparelli",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "24 DEC 2019",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500066@"
    ],
    "childrenIds": [
      "@I500062@"
    ]
  },
  {
    "id": "@I500066@",
    "firstName": "ddf",
    "lastName": "Luparelli",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "24 DEC 2019",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500065@"
    ],
    "childrenIds": [
      "@I500062@"
    ]
  },
  {
    "id": "@I500067@",
    "firstName": "Ercole",
    "lastName": "ASTESIANO",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "ABT 10 JAN 1980",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500075@"
    ],
    "childrenIds": [
      "@I30@",
      "@I500068@"
    ],
    "fatherId": "@I500073@",
    "motherId": "@I500074@"
  },
  {
    "id": "@I500068@",
    "firstName": "Antonio",
    "lastName": "Astesiano",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500070@"
    ],
    "childrenIds": [
      "@I500069@",
      "@I500071@"
    ],
    "fatherId": "@I500067@",
    "motherId": "@I500075@"
  },
  {
    "id": "@I500069@",
    "firstName": "Dario",
    "lastName": "Astesiano",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500068@",
    "motherId": "@I500070@"
  },
  {
    "id": "@I500070@",
    "firstName": "Sconosciuto",
    "lastName": "",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500068@"
    ],
    "childrenIds": [
      "@I500069@",
      "@I500071@"
    ]
  },
  {
    "id": "@I500071@",
    "firstName": "Gabriella",
    "lastName": "Astesiano",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500068@",
    "motherId": "@I500070@"
  },
  {
    "id": "@I500072@",
    "firstName": "Alfredo",
    "lastName": "Astesiano",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500073@",
    "motherId": "@I500074@"
  },
  {
    "id": "@I500073@",
    "firstName": "Sconosciuto",
    "lastName": "ASTESIANO",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500074@"
    ],
    "childrenIds": [
      "@I500067@",
      "@I500072@"
    ]
  },
  {
    "id": "@I500074@",
    "firstName": "Sconosciuto",
    "lastName": "ASTESIANO",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500073@"
    ],
    "childrenIds": [
      "@I500067@",
      "@I500072@"
    ]
  },
  {
    "id": "@I500075@",
    "firstName": "Caterina",
    "lastName": "Callegaris",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500067@"
    ],
    "childrenIds": [
      "@I30@",
      "@I500068@"
    ]
  },
  {
    "id": "@I500076@",
    "firstName": "Cosimo",
    "lastName": "Resta",
    "gender": "M",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [
      "@I12@"
    ]
  },
  {
    "id": "@I500077@",
    "firstName": "Sconosciuto",
    "lastName": "Lhéridaud",
    "gender": "F",
    "isLiving": true,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500080@"
    ],
    "childrenIds": [
      "@I9@"
    ],
    "fatherId": "@I500078@",
    "motherId": "@I500079@"
  },
  {
    "id": "@I500078@",
    "firstName": "Edouard",
    "lastName": "Lhéridaud",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1944",
    "birthPlace": "",
    "deathDate": "1944",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500079@"
    ],
    "childrenIds": [
      "@I500083@",
      "@I500077@",
      "@I500084@"
    ],
    "fatherId": "@I500081@",
    "motherId": "@I500082@"
  },
  {
    "id": "@I500079@",
    "firstName": "Regina",
    "lastName": "Sacre",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1903",
    "birthPlace": "",
    "deathDate": "1996",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500078@"
    ],
    "childrenIds": [
      "@I500083@",
      "@I500077@",
      "@I500084@"
    ],
    "fatherId": "@I500085@",
    "motherId": "@I500086@"
  },
  {
    "id": "@I500080@",
    "firstName": "Robert",
    "lastName": "Moser",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "28 NOV 2021",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500077@"
    ],
    "childrenIds": [
      "@I9@"
    ]
  },
  {
    "id": "@I500081@",
    "firstName": "Fernand",
    "lastName": "Lhéridaud",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "28 NOV 2021",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500082@"
    ],
    "childrenIds": [
      "@I500078@"
    ]
  },
  {
    "id": "@I500082@",
    "firstName": "Marie",
    "lastName": "Grillard",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "28 NOV 2021",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500081@"
    ],
    "childrenIds": [
      "@I500078@"
    ]
  },
  {
    "id": "@I500083@",
    "firstName": "Hélène",
    "lastName": "Lhéridaud",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "1935",
    "birthPlace": "",
    "deathDate": "30 APR 2014",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500078@",
    "motherId": "@I500079@"
  },
  {
    "id": "@I500084@",
    "firstName": "Karl",
    "lastName": "Lhéridaud",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "28 NOV 2021",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500078@",
    "motherId": "@I500079@"
  },
  {
    "id": "@I500085@",
    "firstName": "Victor",
    "lastName": "Sacre",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "28 NOV 2021",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500086@"
    ],
    "childrenIds": [
      "@I500079@"
    ]
  },
  {
    "id": "@I500086@",
    "firstName": "Felicia",
    "lastName": "Daulce",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "28 NOV 2021",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500085@"
    ],
    "childrenIds": [
      "@I500079@"
    ]
  },
  {
    "id": "@I500087@",
    "firstName": "Raffaele",
    "lastName": "Moschettini",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "5 DEC 1898",
    "birthPlace": "",
    "deathDate": "11 FEB 1976",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500088@"
    ],
    "childrenIds": [
      "@I500045@",
      "@I500090@"
    ],
    "motherId": "@I500089@"
  },
  {
    "id": "@I500088@",
    "firstName": "Elvira De",
    "lastName": "Tommaso",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "18 JAN 1902",
    "birthPlace": "",
    "deathDate": "11 FEB 1973",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500087@"
    ],
    "childrenIds": [
      "@I500045@",
      "@I500090@"
    ],
    "fatherId": "@I500091@",
    "motherId": "@I500092@"
  },
  {
    "id": "@I500089@",
    "firstName": "Cosima Maria Giovanna",
    "lastName": "Distante",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [
      "@I500087@"
    ],
    "fatherId": "@I500093@",
    "motherId": "@I500094@"
  },
  {
    "id": "@I500090@",
    "firstName": "Ernesto",
    "lastName": "Moschettini",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "ABT 2007",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500087@",
    "motherId": "@I500088@"
  },
  {
    "id": "@I500091@",
    "firstName": "Antonio De",
    "lastName": "Tommaso",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500092@"
    ],
    "childrenIds": [
      "@I500088@",
      "@I500097@"
    ],
    "fatherId": "@I500095@",
    "motherId": "@I500096@"
  },
  {
    "id": "@I500092@",
    "firstName": "Teresa",
    "lastName": "D'errico",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500091@"
    ],
    "childrenIds": [
      "@I500088@",
      "@I500097@"
    ],
    "fatherId": "@I500098@",
    "motherId": "@I500099@"
  },
  {
    "id": "@I500093@",
    "firstName": "ddf",
    "lastName": "Distante",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500094@"
    ],
    "childrenIds": [
      "@I500089@"
    ]
  },
  {
    "id": "@I500094@",
    "firstName": "ddf",
    "lastName": "Distante",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500093@"
    ],
    "childrenIds": [
      "@I500089@"
    ]
  },
  {
    "id": "@I500095@",
    "firstName": "ddf De",
    "lastName": "Tommaso",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500096@"
    ],
    "childrenIds": [
      "@I500091@"
    ]
  },
  {
    "id": "@I500096@",
    "firstName": "ddf De",
    "lastName": "Tommaso",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500095@"
    ],
    "childrenIds": [
      "@I500091@"
    ]
  },
  {
    "id": "@I500097@",
    "firstName": "Concetta De",
    "lastName": "Tommaso",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "29 NOV 1903",
    "birthPlace": "",
    "deathDate": "22 JUN 1997",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I500091@",
    "motherId": "@I500092@"
  },
  {
    "id": "@I500098@",
    "firstName": "ddf",
    "lastName": "D'errico",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500099@"
    ],
    "childrenIds": [
      "@I500092@"
    ]
  },
  {
    "id": "@I500099@",
    "firstName": "ddf",
    "lastName": "D'errico",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "13 MAY 2022",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500098@"
    ],
    "childrenIds": [
      "@I500092@"
    ]
  },
  {
    "id": "@I500107@",
    "firstName": "Nicoletta",
    "lastName": "Rizzo",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "28 FEB 2024",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I48@"
    ],
    "childrenIds": [
      "@I500108@"
    ]
  },
  {
    "id": "@I500108@",
    "firstName": "Vittorio",
    "lastName": "Murri",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "28 FEB 2024",
    "birthPlace": "",
    "deathDate": "28 FEB 2024",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [],
    "fatherId": "@I48@",
    "motherId": "@I500107@"
  },
  {
    "id": "@I500109@",
    "firstName": "Marcella Giovanna",
    "lastName": "Narducci",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "12 AUG 1942",
    "birthPlace": "",
    "deathDate": "26 MAR 2023",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500110@"
    ],
    "childrenIds": [],
    "fatherId": "@I500042@",
    "motherId": "@I500041@"
  },
  {
    "id": "@I500110@",
    "firstName": "Pietro Vincenzo Antonio",
    "lastName": "Solimeo",
    "gender": "M",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "20 OCT 1938",
    "birthPlace": "",
    "deathDate": "10 MAY 2016",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [
      "@I500109@"
    ],
    "childrenIds": [],
    "motherId": "@I500111@"
  },
  {
    "id": "@I500111@",
    "firstName": "Sconosciuto",
    "lastName": "",
    "gender": "F",
    "isLiving": false,
    "email": "",
    "prefix": "",
    "suffix": "",
    "birthDate": "",
    "birthPlace": "",
    "deathDate": "28 FEB 2024",
    "deathPlace": "",
    "photoUrl": "",
    "notes": "",
    "spouseIds": [],
    "childrenIds": [
      "@I500110@"
    ]
  }
] as unknown as Person[];
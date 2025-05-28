// Script per popolare le tabelle funzioni, skill e funzioneskill con dati di esempio
const { Sequelize } = require('sequelize');
const sequelize = require('./sequelize');
const Funzione = require('./models/Funzione')(sequelize);
const Skill = require('./models/Skill')(sequelize);
const FunzioneSkill = require('./models/FunzioneSkill')(sequelize);

async function seed() {
  await sequelize.sync();

  // Skill di esempio
  const skills = await Skill.bulkCreate([
    { nome: 'mulettista' },
    { nome: 'elettricista' },
    { nome: 'fonico' },
    { nome: 'carpentiere' }
  ], { ignoreDuplicates: true });

  // Funzioni di esempio
  const funzioni = await Funzione.bulkCreate([
    { nome: 'Carico impianto', descrizione: 'Carico e scarico attrezzature' },
    { nome: 'Montaggio luci', descrizione: 'Installazione e cablaggio luci' },
    { nome: 'Montaggio palco', descrizione: 'Assemblaggio struttura palco' }
  ], { ignoreDuplicates: true });

  // Associazioni Funzione <-> Skill (direttamente sulla tabella di join)
  await FunzioneSkill.bulkCreate([
    { funzioneId: funzioni[0].id, skillId: skills[0].id }, // Carico impianto - mulettista
    { funzioneId: funzioni[1].id, skillId: skills[1].id }, // Montaggio luci - elettricista
    { funzioneId: funzioni[2].id, skillId: skills[3].id }  // Montaggio palco - carpentiere
  ], { ignoreDuplicates: true });

  console.log('Dati di esempio inseriti con successo!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });

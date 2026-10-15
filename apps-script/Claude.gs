/**
 * CLAUDE.gs — Création de devis / factures à distance (sans PC)
 * Smartdesignforyou Ltd — complément du script FACTURATIONS SMART (Code.gs)
 * ------------------------------------------------------------------------
 * Principe :
 *   Claude dépose une « demande » (petit fichier .json) dans le dossier Drive
 *   « Factures Smart / Demandes Claude ». Chaque minute, ce script :
 *     1. attribue le numéro officiel (même compteur que l'app),
 *     2. fabrique le PDF au format de l'app,
 *     3. l'archive dans Drive + ajoute la ligne au registre (comme l'app),
 *     4. ajoute le client à la liste s'il est nouveau,
 *     5. écrit le résultat dans « Demandes traitées ».
 *   Le document apparaît ensuite dans l'historique de l'app (bouton PDF + Rouvrir).
 *
 * INSTALLATION (une seule fois) :
 *   Dans le même projet Apps Script que Code.gs : bouton « + » → Script →
 *   nommer « Claude » → coller ce fichier → Enregistrer.
 *   Choisir la fonction « installerClaude » → Exécuter → accepter les autorisations.
 *   (Pas besoin de redéployer l'application Web.)
 * ------------------------------------------------------------------------
 */

const CLAUDE_DOSSIER_DEMANDES = 'Demandes Claude';
const CLAUDE_DOSSIER_TRAITEES = 'Demandes traitées';
const CLAUDE_TVA = 0.15;
const CLAUDE_SCEAU = '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'; // sceau « sd » vert (PNG)
const CLAUDE_SOCIETE = {
  ligne1: 'SMARTDESIGNFORYOU LTD - ROYAL ROAD, TRIOLET, MAURICE',
  ligne2: 'BRN: C191630004   VAT: 276898   MCB: 000449285437',
  signature: 'Réaz Moussa'
};

function installerClaude() {
  const racine = racine_();
  sousDossier_(racine, CLAUDE_DOSSIER_DEMANDES);
  sousDossier_(racine, CLAUDE_DOSSIER_TRAITEES);
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'traiterDemandesClaude')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('traiterDemandesClaude').timeBased().everyMinutes(1).create();
  Logger.log('OK : dossier « ' + CLAUDE_DOSSIER_DEMANDES + ' » prêt, vérification chaque minute.');
}

function traiterDemandesClaude() {
  const racine = racine_();
  const src = sousDossier_(racine, CLAUDE_DOSSIER_DEMANDES);
  const it = src.getFiles();
  if (!it.hasNext()) return;                       // rien à faire : on sort tout de suite

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;                // l'app est en train d'écrire : on réessaiera
  try {
    const dest = sousDossier_(racine, CLAUDE_DOSSIER_TRAITEES);
    while (it.hasNext()) {
      const f = it.next();
      let res;
      try {
        const req = JSON.parse(f.getBlob().getDataAsString('UTF-8'));
        res = req.action === 'statut' ? changerStatut_(req)
          : req.action === 'compteur' ? reglerCompteur_(req)
          : req.action === 'annuler' ? annulerDocument_(req)
          : creerDocument_(req, f.getId());
        res.ok = true;
      } catch (e) {
        res = { ok: false, erreur: String(e && e.message ? e.message : e) };
      }
      res.demande = f.getName();
      res.traiteLe = new Date().toISOString();
      dest.createFile(f.getName().replace(/\.json$/i, '') + '_RESULTAT.json',
        JSON.stringify(res, null, 2), 'application/json');
      f.moveTo(dest);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Demande attendue :
 * { "type": "Facture" | "Devis" | "Bon de livraison" | ...,
 *   "date": "2026-10-15" (optionnel),
 *   "statut": "Payé" | "Non payé" (optionnel),
 *   "client": { "nom": "...", "adresse": "...", "tel": "..." },
 *   "lignes": [ { "nom": "...", "qte": 1, "prixTTC": 575, "notes": "" } ],
 *   "conditions": [ "..." ] (optionnel) }
 */
function creerDocument_(req, fileId) {
  const type = req.type || 'Facture';
  if (!PREFIXES[type]) throw new Error('Type inconnu : ' + type);
  const lignesIn = (req.lignes || []).filter(l => l && l.nom && Number(l.qte) > 0);
  if (!lignesIn.length) throw new Error('Aucune ligne');
  if (!req.client || !req.client.nom) throw new Error('Client manquant');

  const tz = Session.getScriptTimeZone();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.date || '') ? req.date : Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const annee = Number(date.slice(0, 4));
  const statut = req.statut || 'Non payé';
  const client = trouverOuCreerClient_(req.client);

  const uid = 'claude-' + (req.uid || fileId);
  const numero = reserve_({ uid: uid + '|' + type + '|' + annee, type: type, year: annee }).numero;

  // Montants : prix saisis TTC → HT arrondi à la ligne (le total HT = somme des lignes)
  let totalHT = 0, totalTTC = 0;
  const lignes = lignesIn.map(l => {
    const qte = Number(l.qte);
    const ttc = Number(l.prixTTC);
    const ht = Math.round(ttc / (1 + CLAUDE_TVA) * 100) / 100;
    totalHT += Math.round(qte * ht * 100) / 100;
    totalTTC += qte * ttc;
    return { ref: '', nom: String(l.nom), notes: String(l.notes || ''), qte: qte, prixHT_MUR: ht };
  });
  totalHT = Math.round(totalHT * 100) / 100;
  totalTTC = Math.round(totalTTC * 100) / 100;

  const pdf = pdfClaude_({ type, numero, date, statut, client: req.client, lignes, totalHT, totalTTC,
    conditions: req.conditions || [] });

  const r = save_({
    doc: { uid: uid, type: type, numero: numero, date: date, client: req.client.nom, clientId: String(client.id),
      totalTTC_MUR: totalTTC, statut: statut, origine: 'Claude', lignes: lignes },
    pdfBase64: Utilities.base64Encode(pdf.getBytes())
  });
  return { type: type, numero: numero, totalTTC: totalTTC, client: req.client.nom, pdfUrl: r.pdfUrl, fileId: r.fileId };
}

function changerStatut_(req) {
  const sh = ss_().getSheetByName('Registre');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][COLS.indexOf('numero')] === req.numero && data[i][COLS.indexOf('supprime')] !== 'oui') {
      setField_(data[i][0], 'statut', req.statut);
      return { numero: req.numero, statut: req.statut };
    }
  }
  throw new Error('Document introuvable : ' + req.numero);
}

// Règle le prochain numéro d'un type (ne fait jamais reculer le compteur)
// { "action": "compteur", "type": "Facture", "annee": 2026, "prochain": 19 }
function reglerCompteur_(req) {
  if (!PREFIXES[req.type]) throw new Error('Type inconnu : ' + req.type);
  const annee = Number(req.annee) || new Date().getFullYear();
  const cle = 'CPT_' + req.type + '_' + annee;
  const props = PropertiesService.getScriptProperties();
  const avant = Number(props.getProperty(cle) || 1);
  const apres = Math.max(avant, Number(req.prochain) || 1);
  props.setProperty(cle, String(apres));
  return { type: req.type, annee: annee, avant: avant, prochain: apres };
}

// Annule un document : marqué « supprimé » dans le registre (disparaît de l'historique de l'app),
// PDF conservé dans Drive mais renommé « ANNULE_… ». { "action": "annuler", "numero": "FACT-2026-001" }
function annulerDocument_(req) {
  const sh = ss_().getSheetByName('Registre');
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][COLS.indexOf('numero')] === req.numero && data[i][COLS.indexOf('supprime')] !== 'oui') {
      setField_(data[i][0], 'supprime', 'oui');
      const fid = data[i][COLS.indexOf('fileId')];
      if (fid) { try { const f = DriveApp.getFileById(fid); f.setName('ANNULE_' + f.getName()); } catch (e) {} }
      return { numero: req.numero, annule: true };
    }
  }
  throw new Error('Document introuvable : ' + req.numero);
}

// Clients : même liste que l'app (onglet Donnees). Nouveau client → ajouté et synchronisé.
function trouverOuCreerClient_(c) {
  const d = getData_();
  const clients = d.clients || [];
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  let found = clients.find(x => norm(x.name) === norm(c.nom));
  if (found) return found;
  found = { id: Date.now(), name: c.nom, address: c.adresse || '', phone: c.tel || '' };
  clients.push(found);
  putData_({ clients: clients, products: d.products || [], ts: Date.now() });
  return found;
}

// ------------------------------------------------------------------ PDF (même présentation que l'app)
function pdfClaude_(o) {
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = n => (Math.round(n * 100) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const spaced = s => esc(s).split('').join('&#8202;');
  const dateFr = o.date.slice(8, 10) + '/' + o.date.slice(5, 7) + '/' + o.date.slice(0, 4);
  const tva = Math.round((o.totalTTC - o.totalHT) * 100) / 100;
  const statutHtml = o.type === 'Devis' ? '' :
    `<div class="statut" style="color:${o.statut === 'Payé' ? '#2F5D45' : '#8C2F2F'}">${o.statut === 'Payé' ? 'PAYE' : 'NON PAYE'}</div>`;
  const rows = o.lignes.map(l => `<tr><td>${esc(l.nom)}${l.notes ? '<div class="note">' + esc(l.notes) + '</div>' : ''}</td>
    <td class="r">${l.qte.toFixed(2)}</td><td class="r">${fmt(l.prixHT_MUR)}</td><td class="r">${fmt(l.qte * l.prixHT_MUR)}</td></tr>`).join('');
  const cond = o.conditions.length ? '<div class="h">CONDITIONS</div>' + o.conditions.map(c => '<div class="c">- ' + esc(c) + '</div>').join('') : '';
  const contact = [o.client.contact ? 'Contact : ' + esc(o.client.contact) : '', o.client.tel ? 'Tél: ' + esc(o.client.tel) : ''].filter(Boolean).join('&nbsp;&nbsp; ');

  const html = `<html><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 14mm 14mm 12mm 14mm; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1A1C1A; font-size: 9pt; }
  .top { width: 100%; border-bottom: 0.6pt solid #E8E6E0; padding-bottom: 8mm; }
  .logo { width: 14mm; height: 14mm; vertical-align: middle; }
  .brand { display: inline-block; font-size: 16pt; vertical-align: middle; margin-left: 4mm; }
  .meta { float: right; text-align: right; color: #7C7A72; font-size: 8.5pt; line-height: 1.6; }
  .type { font-size: 14pt; font-weight: bold; margin-top: 7mm; }
  .statut { float: right; font-size: 11pt; font-weight: bold; margin-top: -6mm; }
  .h { color: #7C7A72; font-weight: bold; font-size: 9pt; margin-top: 6mm; }
  .cl { font-size: 10pt; margin-top: 2mm; }
  .sub { color: #565550; margin-top: 1.5mm; }
  .devise { color: #7C7A72; font-size: 8pt; margin-top: 4mm; }
  table { width: 100%; border-collapse: collapse; margin-top: 5mm; }
  th { background: #FBFAF7; color: #7C7A72; text-align: left; }
  th, td { border: 0.4pt solid #E8E6E0; padding: 2.4mm 3mm; font-size: 9pt; }
  .r { text-align: right; }
  .note { color: #7C7A72; font-size: 8pt; margin-top: 1mm; }
  .tot { text-align: right; color: #565550; margin-top: 5mm; line-height: 1.8; }
  .ttc { text-align: right; font-weight: bold; font-size: 11pt; border-top: 0.6pt solid #E8E6E0; padding-top: 2mm; margin-left: 120mm; }
  .c { color: #565550; font-size: 8.5pt; margin-top: 1.2mm; }
  .sig { margin-top: 9mm; }
  .foot { position: fixed; bottom: 0; color: #A8A49A; font-size: 7pt; line-height: 1.6; }
  </style></head><body>
  <div class="top"><div class="meta">${spaced(o.numero)}<br>${spaced('DATE : ' + dateFr)}${o.type === 'Devis' ? '<br>' + spaced('VALABLE 30 JOURS') : ''}</div>
    <img class="logo" src="data:image/png;base64,${CLAUDE_SCEAU}"><span class="brand">Smartdesignforyou</span></div>
  <div class="type">${esc(o.type)}</div>${statutHtml}
  <div class="h">CLIENT</div>
  <div class="cl">${esc(o.client.nom)}</div>
  ${o.client.adresse ? '<div class="sub">' + esc(o.client.adresse) + '</div>' : ''}
  ${contact ? '<div class="sub">' + contact + '</div>' : ''}
  <div class="devise">Devise MUR - aucun frais de change</div>
  <table><tr><th>Article / Description</th><th class="r">Qté</th><th class="r">Prix HT (MUR)</th><th class="r">Total HT (MUR)</th></tr>${rows}</table>
  <div class="tot">Total HT : ${fmt(o.totalHT)} MUR<br>TVA 15% : ${fmt(tva)} MUR</div>
  <div class="ttc">Total TTC : ${fmt(o.totalTTC)} MUR</div>
  ${cond}
  <div class="sig">Pour Smartdesignforyou Ltd<br><br><br>${esc(CLAUDE_SOCIETE.signature)}</div>
  <div class="foot">${CLAUDE_SOCIETE.ligne1}<br>${CLAUDE_SOCIETE.ligne2}<br>DOCUMENT GENERE PAR SMARTDESIGNFORYOU</div>
  </body></html>`;
  return HtmlService.createHtmlOutput(html).getBlob().getAs('application/pdf')
    .setName(o.type + '_' + o.numero + '.pdf');
}

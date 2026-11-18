/* La cuisine d'Eva — v2 : 5 onglets, stock automatique, vérification du dimanche.
   Toutes les données restent sur le téléphone (localStorage). */
(function(){
'use strict';
var AISLES = ['Fruits & légumes','Frais & crèmerie','Tofu & protéines','Féculents & céréales','Conserves & bocaux','Épicerie','Surgelés','Boulangerie','Placard (huile, épices, sauces)','Entretien','Salle de bain','Papier & consommables','Autre'];
var AISLE_COL = ['#7BD389','#FFD84D','#F4A6C0','#FFB872','#FF7A7A','#B79BFF','#8CC8FF','#E8B98A','#C9A27E','#6FC3E8','#F7A8D8','#B8D86B','#C8C8D0'];
var MAISON_AISLES = ['Entretien','Salle de bain','Papier & consommables'];
var MAISON_HELP = {'Entretien':'Vaisselle, linge, ménage','Salle de bain':'Hygiène et soins','Papier & consommables':'Papier, sacs, emballages'};
var MAISON_SUGG = {
  'Entretien':['Liquide vaisselle','Pastilles lave-vaisselle','Lessive','Adoucissant','Éponges','Nettoyant multi-surfaces','Javel','Sacs poubelle'],
  'Salle de bain':['Gel douche','Shampoing','Après-shampoing','Dentifrice','Déodorant','Savon mains','Cotons'],
  'Papier & consommables':['Papier toilette','Essuie-tout','Mouchoirs','Papier aluminium','Film alimentaire','Papier cuisson','Sacs congélation']
};
var LEVELS = [['ok','J’en ai'],['low','Bientôt fini'],['out','Fini']];
var LEVEL_NEXT = {ok:'low', low:'out', out:'ok'};
var MAISON_CHECK_DAYS = 30;
var MAISON_FAST = /liquide vaisselle|lave.vaisselle|essuie|sopalin|papier toilette|sacs? poubelle|mouchoir|gel douche|dentifrice|eponge/;
var EVERY_OPTS = [[7,'1 semaine'],[15,'15 jours'],[30,'1 mois'],[60,'2 mois']];
var PLACARD = 'Placard (huile, épices, sauces)';
var FRESH_AISLES = ['Fruits & légumes','Frais & crèmerie','Tofu & protéines','Boulangerie'];
var DAYS = ['—','Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
var UNITS = [['g','g'],['kg','kg'],['ml','ml'],['cl','cl'],['l','l'],['pc','pièce'],['cas','c. à s.'],['cac','c. à c.'],['gousse','gousse'],['botte','botte'],['boite','boîte'],['tranche','tranche'],['sachet','sachet'],['pincee','pincée']];
var SHORT = {g:'g',kg:'kg',ml:'ml',cl:'cl',l:'l',pc:'',cas:'c. à s.',cac:'c. à c.',gousse:'gousse',botte:'botte',boite:'boîte',tranche:'tranche',sachet:'sachet',pincee:'pincée'};
var PLUR = {gousse:1,botte:1,boite:1,tranche:1,sachet:1,pincee:1};
var COUNT = {pc:1,botte:1,boite:1,sachet:1,gousse:1,tranche:1};
var BASE = {g:['g',1],kg:['g',1000],ml:['ml',1],cl:['ml',10],l:['ml',1000]};
var PACK_LABELS = ['pot','boîte','bloc','barquette','brique','sachet','paquet','boule','botte','bouteille'];
/* ---------- ambiance : 5 réglages, le reste est calculé ---------- */
var LOOK_PRESETS = [
  ['rose','Rose bonbon',{style:'kawaii',pattern:'dots',bg:'#FFF4F7',accent:'#FF5C8A',second:'#2DBE74'}],
  ['lavande','Lavande',{style:'kawaii',pattern:'dots',bg:'#F7F3FF',accent:'#8A63F2',second:'#2DBE74'}],
  ['menthe','Menthe',{style:'kawaii',pattern:'dots',bg:'#F0FBF5',accent:'#1FA56B',second:'#FF7FA0'}],
  ['peche','Pêche',{style:'kawaii',pattern:'dots',bg:'#FFF6EE',accent:'#FF7A3D',second:'#2DBE74'}],
  ['ciel','Ciel',{style:'kawaii',pattern:'dots',bg:'#F2F8FF',accent:'#3D8BFD',second:'#2DBE74'}],
  ['anthracite','Anthracite',{style:'kawaii',pattern:'dots',bg:'#1F1E24',accent:'#FF7AA2',second:'#4FD08A'}],
  ['pixel','Pixel nuit',{style:'pixel',pattern:'grid',bg:'#1E2036',accent:'#FFC94A',second:'#4FD08A'}],
  ['pixel-anthracite','Pixel anthracite',{style:'pixel',pattern:'grid',bg:'#1F1E24',accent:'#FF7AA2',second:'#4FD08A'}],
  ['pixel-menthe','Pixel forêt',{style:'pixel',pattern:'grid',bg:'#15241E',accent:'#6EE7A8',second:'#FFC94A'}],
  ['pixel-violet','Pixel néon',{style:'pixel',pattern:'grid',bg:'#1C172E',accent:'#5FD3F3',second:'#B79BFF'}]
];
var SW_BG = ['#FFF4F7','#F7F3FF','#F0FBF5','#FFF6EE','#F2F8FF','#FFFFFF','#1F1E24','#1E2036','#15241E','#1C172E','#2A1F1A','#121214'];
var SW_ACCENT = ['#FF5C8A','#FF7AA2','#8A63F2','#3D8BFD','#5FD3F3','#1FA56B','#6EE7A8','#FFC94A','#FF7A3D','#E23D5B'];
var SW_SECOND = ['#2DBE74','#4FD08A','#5FD3F3','#3D8BFD','#B79BFF','#FF7FA0','#FFC94A','#FF9F43'];
function presetLook(id){ for(var i=0;i<LOOK_PRESETS.length;i++) if(LOOK_PRESETS[i][0]===id) return clone(LOOK_PRESETS[i][2]); return clone(LOOK_PRESETS[0][2]); }
function hx(c){ c=String(c||'').replace('#',''); if(c.length===3) c=c.split('').map(function(x){return x+x;}).join(''); var n=parseInt(c,16); if(isNaN(n)) n=0; return [n>>16&255,n>>8&255,n&255]; }
function toHex(r){ return '#'+r.map(function(v){ v=Math.max(0,Math.min(255,Math.round(v))); return (v<16?'0':'')+v.toString(16); }).join('').toUpperCase(); }
function mixC(a,b,t){ var x=hx(a), y=hx(b); return toHex([x[0]+(y[0]-x[0])*t, x[1]+(y[1]-x[1])*t, x[2]+(y[2]-x[2])*t]); }
function lumC(c){ var r=hx(c).map(function(v){ v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }); return 0.2126*r[0]+0.7152*r[1]+0.0722*r[2]; }
function lookVars(L){
  var bg=L.bg, ac=L.accent, se=L.second, dark=lumC(bg)<0.25, v={};
  v['--bg']=bg;
  v['--surface']= dark ? mixC(bg,'#FFFFFF',0.07) : (lumC(bg)>0.85 ? '#FFFFFF' : mixC(bg,'#FFFFFF',0.75));
  v['--ink']= dark ? '#F3EDF1' : mixC(ac,'#1E141A',0.78);
  v['--line']= dark ? mixC(bg,'#FFFFFF',0.16) : mixC(bg,ac,0.16);
  v['--muted']= mixC(v['--ink'],bg,0.42);
  v['--accent']=ac;
  v['--soft']= dark ? mixC(v['--surface'],ac,0.22) : mixC('#FFFFFF',ac,0.17);
  v['--mint']= dark ? mixC(v['--surface'],se,0.3) : mixC('#FFFFFF',se,0.22);
  v['--mint-ink']= dark ? mixC(se,'#FFFFFF',0.35) : mixC(se,'#000000',0.42);
  v['--on-accent']= lumC(ac)>0.45 ? mixC(bg,'#000000',dark?0:0.85) : '#FFFFFF';
  if(dark){ v['--butter']='#463D1F'; v['--butter-ink']='#FFE08A'; v['--sky']='#22374F'; v['--lav']='#342D4F'; v['--peach']='#47332A'; }
  else { v['--butter']='#FFF0B3'; v['--butter-ink']='#875800'; v['--sky']='#D6EAFF'; v['--lav']='#E7DDFF'; v['--peach']='#FFE2CC'; }
  return {vars:v, dark:dark};
}
function curLook(){ return (S && S.look) || presetLook('rose'); }
function isPixel(){ return curLook().style==='pixel'; }
function applyLook(){
  var L=curLook(), r=lookVars(L), b=document.body;
  Object.keys(r.vars).forEach(function(k){ b.style.setProperty(k, r.vars[k]); });
  b.removeAttribute('data-pal');
  if(r.dark) b.setAttribute('data-dark','1'); else b.removeAttribute('data-dark');
  if(L.style==='pixel') b.setAttribute('data-pixel','1'); else b.removeAttribute('data-pixel');
  b.setAttribute('data-pattern', L.pattern||'dots');
  try{ var mt=document.querySelector('meta[name=theme-color]'); if(mt) mt.setAttribute('content', L.bg); }catch(e){}
}
var BGS = ['#FFD6E2','#FFE2CC','#FFF0B3','#D3F2DF','#D6EAFF','#E7DDFF','#FFFFFF'];
var TYPES = [['compte','Compté'],['basique','Basique'],['frais','Frais']];
var TYPE_LABEL = {compte:'Compté',basique:'Basique',frais:'Frais'};
var TYPE_HELP = {compte:'Se garde longtemps, on compte ce qu’il reste',basique:'Huile, sel, épices : juste « j’en ai » ou « fini » (touche l’étiquette)',frais:'S’abîme vite : l’appli te demandera s’il en reste'};
var DAY_MS = 86400000;
var FRESH_DAYS = 4, CONFIRM_DAYS = 21;
var TIPS_RAW = {
  'sauce tomate':'Le reste se congèle très bien, en bac à glaçons par exemple.',
  'lait de coco':'Se congèle aussi, ou part dans un smoothie ou un porridge.',
  'feta':'Ouverte, elle tient environ 5 jours dans sa saumure, plus longtemps couverte d’huile d’olive.',
  'creme fraiche':'Ouverte, à finir en 3 jours : dans des pâtes, une soupe ou une sauce.',
  'epinards':'Fais-les tomber à la poêle puis congèle-les en petites boules.',
  'tomates cerises':'Parfaites rôties ou en salade le lendemain.',
  'pois chiches':'Le reste devient un houmous ou des pois chiches rôtis au four.',
  'haricots noirs':'Le reste se congèle dans un peu d’eau.',
  'tofu ferme':'Couvert d’eau au frigo, à changer chaque jour, il tient 3 à 4 jours.',
  'mozzarella':'À finir en 2 jours, sur une tartine ou une salade.',
  'tortillas':'Elles se congèlent, séparées par du papier cuisson.',
  'champignons':'Ils tiennent mieux dans un sac en papier au frigo, ou poêlés puis congelés.'
};
var AISLE_RULES = [
  [/liquide vaisselle|lave.vaisselle|lessive|adoucissant|eponge|nettoyant|javel|sacs? poubelle|detergent|vinaigre blanc|desinfect|serpillere|serpilliere|detartrant|anti.calcaire|produit menager|spray/, 'Entretien'],
  [/gel douche|shampo|dentifrice|brosse a dent|deodorant|savon|coton|rasoir|creme hydrat|serviette hygien|tampon|protege.slip|demaquill|gel coiffant|creme solaire|fil dentaire|bain de bouche/, 'Salle de bain'],
  [/papier toilette|(^|\s)pq(\s|$)|essuie.tout|sopalin|mouchoir|papier alu|aluminium|film alimentaire|papier cuisson|sacs? (de )?congelation|sacs? congel|allumette|ampoule|piles?(\s|$)|sacs? (de )?course|filtres? (a )?cafe/, 'Papier & consommables'],
  [/lait de coco|creme de coco|sauce tomate|coulis|passata|concass|pois chiche|haricots? (rouge|noir|blanc|blancs|rouges|noirs)|mais en|conserve|olive noire|olives/, 'Conserves & bocaux'],
  [/beurre de cacahu|puree d.amande|tahin|maizena|farine|levure|noix|amande|noisette|graine|chocolat|sucre|cacao|flocon/, 'Épicerie'],
  [/sauce soja|huile|vinaigre|sel\b|poivre|epice|cumin|curry|paprika|curcuma|moutarde|miel|sirop|piment|origan|thym|herbes de provence|concentre|cannelle|muscade|bouillon|garam|harissa|sriracha|ketchup|mayo/, PLACARD],
  [/surgel|edamame|petits pois/, 'Surgelés'],
  [/tofu|tempeh|seitan|falafel|steak veg|hache veg/, 'Tofu & protéines'],
  [/feta|mozza|parmesan|fromage|creme|lait|beurre|yaourt|oeuf|ricotta|burrata|comte|chevre|halloumi|emmental|skyr/, 'Frais & crèmerie'],
  [/pates|pate\b|spaghetti|tagliatelle|penne|riz|quinoa|semoule|boulgour|lentille|nouille|gnocchi|couscous/, 'Féculents & céréales'],
  [/pain|baguette|tortilla|wrap|pita|burger|brioche/, 'Boulangerie'],
  [/tomate|oignon|ail\b|echalote|poivron|courgette|aubergine|carotte|concombre|avocat|citron|epinard|salade|champignon|patate|pomme|brocoli|chou|basilic|coriandre|persil|menthe|gingembre|banane|poireau|potiron|butternut|courge|betterave|radis|roquette|fruit|legume|ciboulette|celeri|fenouil|mangue|haricots verts/, 'Fruits & légumes']
];
/* Variantes de noms qui partagent la même icône (fichier icons/ingredients/<nom>.webp) */
var ICON_ALIAS = {"tomates cerises":"tomate",
  "tomate cerise":"tomate",
  "tomates":"tomate",
  "sauce tomate":"sauce-tomate",
  "oignons":"oignon",
  "oignon rouge":"oignon",
  "echalote":"oignon",
  "ail":"ail",
  "gousse d ail":"ail",
  "champignons de paris":"champignon",
  "champignons":"champignon",
  "champignon":"champignon",
  "oeufs":"oeuf",
  "oeuf":"oeuf",
  "pates":"pates",
  "spaghetti":"pates",
  "penne":"pates",
  "tagliatelles":"pates",
  "riz basmati":"riz",
  "riz":"riz",
  "huile d olive":"huile-olive",
  "huile":"huile-olive",
  "pois chiches":"pois-chiches",
  "haricots noirs":"haricots-noirs",
  "haricots rouges":"haricots-rouges",
  "feta":"feta",
  "tofu ferme":"tofu",
  "tofu":"tofu",
  "lait de coco":"lait-coco",
  "creme fraiche":"creme",
  "citron vert":"citron-vert",
  "citron":"citron",
  "carottes":"carotte",
  "carotte":"carotte",
  "basilic":"basilic",
  "epinards":"epinards",
  "avocat":"avocat",
  "poivron rouge":"poivron",
  "poivron":"poivron",
  "patate douce":"patate-douce",
  "sauce soja":"sauce-soja",
  "maizena":"maizena",
  "bouillon de legumes":"bouillon",
  "herbes de provence":"herbes",
  "curry en poudre":"curry",
  "cumin":"cumin","cannelle":"cumin","curcuma":"curry","paprika fume":"epices","poivre noir":"poivre","fleur de sel":"sel","sel fin":"sel","origan":"herbes","thym":"herbes",
  "paprika fume":"epices",
  "paprika":"epices",
  "baguette":"pain",
  "pain":"pain",
  "tortillas":"tortilla",
  "concombre":"concombre",
  "edamame":"edamame",
  "beurre de cacahuete":"beurre-cacahuete",
  "mozzarella":"mozzarella",
  "courgette":"courgette",
  "courgettes":"courgette",
  "tomate":"tomate",
  "oignon":"oignon",
  "aubergine":"aubergine",
  "brocoli":"brocoli",
  "pomme de terre":"pomme-de-terre",
  "coriandre":"coriandre",
  "persil":"persil",
  "gingembre":"gingembre",
  "salade":"salade",
  "laitue":"salade",
  "brocolis":"brocoli",
  "courge butternut":"butternut",
  "courge":"butternut",
  "persil plat":"persil",
  "patates":"pomme-de-terre",
  "patate":"pomme-de-terre",
  "poireau":"poireau",
  "butternut":"butternut",
  "pomme":"pomme",
  "banane":"banane",
  "parmesan":"parmesan",
  "beurre":"beurre",
  "lait":"lait",
  "yaourt":"yaourt",
  "tortilla":"tortilla",
  "lentilles corail":"lentilles",
  "quinoa":"quinoa",
  "gnocchis":"gnocchis",
  "farine":"farine",
  "sucre":"sucre",
  "epices":"epices",
  "curry":"curry",
  "bouillon":"bouillon",
  "sel":"sel",
  "poivre":"poivre",
  "vinaigre":"vinaigre",
  "miel":"miel",
  "moutarde":"moutarde",
  "liquide vaisselle":"liquide-vaisselle",
  "pastilles lave vaisselle":"pastilles-lave-vaisselle",
  "lessive":"lessive",
  "eponges":"eponge",
  "sacs poubelle":"sacs-poubelle",
  "adoucissant":"adoucissant",
  "nettoyant multi surfaces":"nettoyant",
  "javel":"javel",
  "gel douche":"gel-douche",
  "shampoing":"shampoing",
  "dentifrice":"dentifrice",
  "apres shampoing":"apres-shampoing",
  "deodorant":"deodorant",
  "savon mains":"savon",
  "cotons":"cotons",
  "papier toilette":"papier-toilette",
  "essuie tout":"essuie-tout",
  "mouchoirs":"mouchoirs",
  "papier aluminium":"papier-alu",
  "film alimentaire":"film-alimentaire",
  "papier cuisson":"papier-cuisson",
  "sacs congelation":"sacs-congelation",
  "eponge":"eponge",
  "sac poubelle":"sacs-poubelle",
  "pq":"papier-toilette",
  "sopalin":"essuie-tout",
  "lentilles":"lentilles",
  "lentilles vertes":"lentilles",
  "pois chiche":"pois-chiches",
  "gnocchi":"gnocchis",
  "pommes de terre":"pomme-de-terre",
  "pommes":"pomme",
  "bananes":"banane",
  "yaourts":"yaourt",
  "savon":"savon",
  "papier alu":"papier-alu",
  "bouillon cube":"bouillon"};
var ICO_COLS = ['#FF8FB1','#7BD389','#FFB872','#8CC8FF','#B79BFF','#FFC93C','#FF7A7A','#5DCFB8'];

/* ---------- petits dessins ---------- */
var INK='#4A2B3A';
var O=' stroke="'+INK+'" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"';
function face(x,y,s){
  s=s||1; var f=function(n){return Math.round(n*100)/100;};
  return '<g fill="'+INK+'"><circle cx="'+f(x-3.4*s)+'" cy="'+f(y)+'" r="'+f(1.4*s)+'"/><circle cx="'+f(x+3.4*s)+'" cy="'+f(y)+'" r="'+f(1.4*s)+'"/></g>'+
    '<path d="M'+f(x-1.9*s)+' '+f(y+2.1*s)+' q'+f(1.9*s)+' '+f(2*s)+' '+f(3.8*s)+' 0" fill="none" stroke="'+INK+'" stroke-width="'+f(1.2*s)+'" stroke-linecap="round"/>'+
    '<g fill="#FF7FA0" opacity=".6"><ellipse cx="'+f(x-6.2*s)+'" cy="'+f(y+2.3*s)+'" rx="'+f(1.9*s)+'" ry="'+f(1.3*s)+'"/><ellipse cx="'+f(x+6.2*s)+'" cy="'+f(y+2.3*s)+'" rx="'+f(1.9*s)+'" ry="'+f(1.3*s)+'"/></g>';
}
var MOTIFS = {
  champignon:{label:'Champignon',bg:'#D3F2DF',re:/champignon|cepe|girolle|shiitake/,svg:'<path d="M5 21C5 11 12 6 20 6s15 5 15 15z" fill="#F25C6A"'+O+'/><circle cx="12.5" cy="14" r="2.4" fill="#fff"/><circle cx="21.5" cy="10.5" r="1.9" fill="#fff"/><circle cx="28.5" cy="16" r="2.1" fill="#fff"/><rect x="12.5" y="21" width="15" height="14" rx="6" fill="#FFF3E2"'+O+'/>'+face(20,27.5,.72)},
  tomate:{label:'Tomate',bg:'#FFF0B3',re:/tomate|shakshuka|bolognaise|arrabbiata/,svg:'<circle cx="20" cy="23" r="12.5" fill="#FF6B6B"'+O+'/><path d="M12.5 12.8Q20 8 27.5 12.8Q20 16 12.5 12.8Z" fill="#4CB46A"'+O+'/><path d="M20 11V5.5" stroke="#4CB46A" stroke-width="2.4" stroke-linecap="round"/>'+face(20,24,.85)},
  avocat:{label:'Avocat',bg:'#FFE2CC',re:/avocat|guacamole/,svg:'<path d="M20 4C28 4 33 15 33 24C33 31.5 27.5 36.5 20 36.5S7 31.5 7 24C7 15 12 4 20 4Z" fill="#5FB35A"'+O+'/><path d="M20 8.5C25.5 8.5 29 17 29 24C29 29 25 33 20 33S11 29 11 24C11 17 14.5 8.5 20 8.5Z" fill="#E6F6A8"/><circle cx="20" cy="26" r="5.4" fill="#B0703F"'+O+'/>'+face(20,16.5,.62)},
  citron:{label:'Citron',bg:'#D6EAFF',re:/citron|lemon/,svg:'<ellipse cx="20" cy="22.5" rx="14" ry="10.5" fill="#FFE066"'+O+'/><path d="M20 12Q24 5 30.5 7Q27 12.5 20 12Z" fill="#7BCB6A"'+O+'/>'+face(20,22.5,.85)},
  carotte:{label:'Carotte',bg:'#E7DDFF',re:/carotte/,svg:'<path d="M16 12Q14 5 17 3.5Q19 7.5 20 11Q21 3.5 24 3.5Q25.5 8 23.5 12" fill="#5DBB63"'+O+'/><path d="M10.5 14Q20 9.5 29.5 14L21.5 35.5Q20 38 18.5 35.5Z" fill="#FF9F43"'+O+'/>'+face(20,19.5,.7)},
  fraise:{label:'Fraise',bg:'#D3F2DF',re:/fraise|framboise|fruits? rouges?/,svg:'<path d="M20 36C11 31 7.5 23 8.5 17C9.5 12.5 15 11.5 20 13C25 11.5 30.5 12.5 31.5 17C32.5 23 29 31 20 36Z" fill="#FF5C7A"'+O+'/><g fill="#FFE8A3"><ellipse cx="12.5" cy="19" rx=".9" ry="1.3"/><ellipse cx="27.5" cy="19" rx=".9" ry="1.3"/><ellipse cx="15" cy="28" rx=".9" ry="1.3"/><ellipse cx="25" cy="28" rx=".9" ry="1.3"/><ellipse cx="20" cy="31.5" rx=".9" ry="1.3"/></g><path d="M12 12.5Q16 9 20 12Q24 9 28 12.5Q24 15.5 20 14Q16 15.5 12 12.5Z" fill="#4CB46A"'+O+'/>'+face(20,22,.75)},
  oeuf:{label:'Œuf',bg:'#D6EAFF',re:/oeuf|omelette|quiche/,svg:'<path d="M7.5 20C6.5 12 13.5 7.5 20 8.5C27 6.5 34.5 12 33.5 20C34.5 28 27.5 33.5 20 32.5C12 34 6.5 28 7.5 20Z" fill="#fff"'+O+'/><circle cx="20.5" cy="20.5" r="7.2" fill="#FFC93C"'+O+'/>'+face(20.5,20.5,.6)},
  basilic:{label:'Feuille',bg:'#FFE2CC',re:/basilic|pesto|epinard|salade|roquette|persil|coriandre|menthe|herbe|vert/,svg:'<path d="M20 36C9 30.5 6.5 17.5 12.5 9.5C16.5 4 24 4 27.5 9.5C33.5 17.5 31 30.5 20 36Z" fill="#57B65F"'+O+'/><path d="M20 36V31" stroke="'+INK+'" stroke-width="1.7" stroke-linecap="round"/>'+face(20,20,.75)},
  piment:{label:'Piment',bg:'#FFF0B3',re:/piment|curry|chili|harissa|epice|tikka|masala|sriracha/,svg:'<path d="M8.5 12C14 13 17 15.5 20 19.5C24 25.5 28 31 33.5 34C26 35.5 18.5 32.5 14.5 27.5C10.5 22.5 8.5 17.5 8.5 12Z" fill="#FF4D4D"'+O+'/><path d="M9 12Q5.5 8 8 4.5" fill="none" stroke="#4CB46A" stroke-width="2.6" stroke-linecap="round"/>'+face(17,21.5,.58)},
  pates:{label:'Pâtes',bg:'#FFD6E2',re:/pates|pate\b|spaghetti|penne|tagliatelle|farfalle|lasagne|gnocchi|nouille|ramen|linguine|fusilli|macaroni/,svg:'<path d="M6.5 11.5L18 17.5V23.5L6.5 29.5Q4 20.5 6.5 11.5Z M33.5 11.5L22 17.5V23.5L33.5 29.5Q36 20.5 33.5 11.5Z" fill="#FFD27A"'+O+'/><path d="M9.5 15.5v10M30.5 15.5v10" stroke="#E8A93C" stroke-width="1.3" stroke-linecap="round"/><rect x="15.5" y="15" width="9" height="11" rx="4" fill="#FFC14D"'+O+'/>'+face(20,19.8,.42)},
  brocoli:{label:'Brocoli',bg:'#FFE2CC',re:/brocoli|chou/,svg:'<path d="M15 20L25 20L23.5 34.5Q20 36.5 16.5 34.5Z" fill="#A8DB8F"'+O+'/><circle cx="12.5" cy="15.5" r="7" fill="#5DBB63"'+O+'/><circle cx="27.5" cy="15.5" r="7" fill="#5DBB63"'+O+'/><circle cx="20" cy="11" r="7.5" fill="#5DBB63"'+O+'/>'+face(20,15,.62)},
  aubergine:{label:'Aubergine',bg:'#FFF0B3',re:/aubergine/,svg:'<path d="M23 12C31 15 33.5 26 28.5 32C23.5 37.5 14 36.5 10 31C6 25.5 9 19 15 16C18 14.5 20 11 23 12Z" fill="#9B6BD6"'+O+'/><path d="M19.5 12.5Q23.5 7 29.5 10Q26.5 14 22 13.5Z" fill="#5DBB63"'+O+'/><path d="M26 9.5L28.5 5" stroke="#5DBB63" stroke-width="2.4" stroke-linecap="round"/>'+face(19,25,.7)},
  fromage:{label:'Fromage',bg:'#E7DDFF',re:/feta|fromage|mozza|parmesan|chevre|comte|raclette|cheddar|burrata|halloumi|gratin/,svg:'<path d="M5 31L35 31L35 15Z" fill="#FFD84D"'+O+'/><path d="M5 31L35 15L29 11.5Z" fill="#FFE98A"'+O+'/><circle cx="31" cy="26.5" r="1.8" fill="#F2B92E"/><circle cx="14" cy="28.5" r="1.4" fill="#F2B92E"/>'+face(25,25.5,.55)},
  coeur:{label:'Cœur',bg:'#FFD6E2',re:/(?!)/,svg:'<path d="M20 34.5C8 26.5 5 18 9 12.5C12.5 8 18 9 20 13C22 9 27.5 8 31 12.5C35 18 32 26.5 20 34.5Z" fill="#FF7FA0"'+O+'/>'+face(20,20.5,.75)}
};
var MOTIF_KEYS=Object.keys(MOTIFS);
var SPARK='<path d="M0-4.5L1.2-1.2L4.5 0L1.2 1.2L0 4.5L-1.2 1.2L-4.5 0L-1.2-1.2Z" fill="#fff"/>';
function motifSVG(k){ var m=MOTIFS[k]||MOTIFS.coeur; return '<svg viewBox="0 0 40 40" aria-hidden="true">'+m.svg+'</svg>'; }
var pidN=0;
function coverHTML(c){
  if(c.photo) return '<img src="'+c.photo+'" alt="">';
  var ms=(c.motifs&&c.motifs.length?c.motifs:['coeur']).filter(function(k){return MOTIFS[k];}); if(!ms.length) ms=['coeur'];
  var a=ms[0], b=ms[1]||ms[0], id='pt'+(++pidN);
  return '<svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="'+id+'" width="88" height="88" patternUnits="userSpaceOnUse" patternTransform="rotate(-10)">'+
    '<g transform="translate(4 4) rotate(-8 20 20) scale(.95)">'+MOTIFS[a].svg+'</g>'+
    '<g transform="translate(48 48) rotate(10 20 20) scale(.95)">'+MOTIFS[b].svg+'</g>'+
    '<g transform="translate(66 18)" opacity=".95">'+SPARK+'</g><g transform="translate(22 66) scale(.7)" opacity=".95">'+SPARK+'</g>'+
    '<circle cx="80" cy="44" r="2" fill="#fff" opacity=".9"/><circle cx="40" cy="84" r="1.6" fill="#fff" opacity=".9"/>'+
    '</pattern></defs><rect width="600" height="200" fill="'+esc(c.bg||MOTIFS[a].bg)+'"/><rect width="600" height="200" fill="url(#'+id+')"/></svg>';
}
function autoCover(r){
  var found=[];
  var scan=function(text){
    var t=deacc(text), hits=[];
    MOTIF_KEYS.forEach(function(k){ var m=t.match(MOTIFS[k].re); if(m) hits.push([m.index,k]); });
    hits.sort(function(x,y){return x[0]-y[0];}).forEach(function(h){ if(found.indexOf(h[1])<0) found.push(h[1]); });
  };
  scan(r.name||'');
  if(found.length<2) (r.ingredients||[]).forEach(function(i){ scan(i.name||''); });
  found=found.slice(0,2); if(!found.length) found=['coeur'];
  return {motifs:found, bg:MOTIFS[found[0]].bg};
}
function coverOf(r){ var c=r.cover; if(c && (c.photo || (c.motifs && c.motifs.length))) return c; var a=autoCover(r); if(c && c.bg) a.bg=c.bg; return a; }

/* ---------- utilitaires ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function uid(p){return (p||'x')+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function num(v){ if(typeof v==='number')return v; v=String(v==null?'':v).trim().replace(',','.'); var f=v.match(/^(\d+)\s*\/\s*(\d+)$/); if(f) return +f[1]/+f[2]; var n=parseFloat(v); return isNaN(n)?0:n; }
function clone(o){return JSON.parse(JSON.stringify(o));}
function deacc(s){return String(s||'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').normalize('NFD').replace(/[̀-ͯ]/g,'');}
function norm(s){
  return deacc(s).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim().split(' ').map(function(w){
    return (w.length>4 && /[sx]$/.test(w) && !/ss$/.test(w)) ? w.slice(0,-1) : w;
  }).join(' ');
}
function fmtNum(n){
  var r = n>=10 ? Math.round(n) : Math.round(n*100)/100;
  var whole=Math.floor(r), frac=Math.round((r-whole)*100)/100;
  var F={0.5:'½',0.25:'¼',0.75:'¾'};
  if(F[frac]) return (whole?whole:'')+F[frac];
  return String(r).replace('.',',');
}
function toBase(q,u){var b=BASE[u]; return b?{q:q*b[1],u:b[0]}:{q:q,u:u||'pc'};}
function fmtQty(q,u){
  if(u==='g' && q>=1000) return fmtNum(q/1000)+' kg';
  if(u==='ml' && q>=1000) return fmtNum(q/1000)+' l';
  if(u==='pc' || !u || u==='*') return fmtNum(q);
  return fmtNum(q)+' '+SHORT[u]+(PLUR[u] && q>1 ? 's':'');
}
function unitLabel(u){ return u==='pc'||!u ? 'pièce(s)' : (SHORT[u]||u); }
function plural(label,n){ if(n<=1) return label; return /[sx]$/.test(label)?label:label+'s'; }
function cap(s){ s=String(s||''); return s.charAt(0).toUpperCase()+s.slice(1); }
function guessAisle(name){ var n=deacc(name); for(var i=0;i<AISLE_RULES.length;i++){ if(AISLE_RULES[i][0].test(n)) return AISLE_RULES[i][1]; } return 'Autre'; }
var TIPS={}; Object.keys(TIPS_RAW).forEach(function(k){TIPS[norm(k)]=TIPS_RAW[k];});
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function lsDel(k){try{localStorage.removeItem(k);}catch(e){}}
function now(){ return Date.now(); }
function daysAgo(t){ return Math.floor((now()-(t||0))/DAY_MS); }
function agoText(t){ var d=daysAgo(t); return d<=0?'aujourd’hui':d===1?'hier':'il y a '+d+' j'; }
function vals(o){ return Object.keys(o).map(function(k){return o[k];}); }
var CLOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
var PEOPLE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.5.8 2.6 2.5 3 5.2"/></svg>';
var HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5C5 15.8 2.5 11.5 4 8c1.3-3 5.3-3.6 8-.6 2.7-3 6.7-2.4 8 .6 1.5 3.5-1 7.8-8 12.5z" fill="currentColor"/></svg>';
var HEART_O='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5C5 15.8 2.5 11.5 4 8c1.3-3 5.3-3.6 8-.6 2.7-3 6.7-2.4 8 .6 1.5 3.5-1 7.8-8 12.5z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>';
var GEAR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

/* ---------- icônes d'ingrédients ---------- */
window.__icoMiss = window.__icoMiss || {};
function iconSlug(name){
  var k=deacc(name).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  if(ICON_ALIAS[k]) return ICON_ALIAS[k];
  var n=norm(name); if(ICON_ALIAS[n]) return ICON_ALIAS[n];
  return n.replace(/ /g,'-');
}
function icoHTML(name, small){
  var slug=iconSlug(name), n=deacc(name), h=0; for(var i=0;i<n.length;i++) h=(h*31+n.charCodeAt(i))>>>0;
  var col=ICO_COLS[h%ICO_COLS.length], ini=esc(cap(String(name||'?').trim().charAt(0)));
  var folder=isPixel() ? 'ingredients-pixel' : 'ingredients', id=folder+'/'+slug;
  var data=window.ICON_DATA && window.ICON_DATA[id];
  var src=data || ('icons/'+id+'.webp');
  var img = (!data && window.__icoMiss[id]) ? '' : '<img src="'+esc(src)+'" alt="" loading="lazy" onload="this.style.opacity=1;this.parentNode.style.background=\'transparent\';this.parentNode.style.color=\'transparent\'" onerror="window.__icoMiss[\''+esc(id)+'\']=1;this.remove()">';
  return '<span class="ico'+(small?' sm':'')+'" style="background:'+col+'" aria-hidden="true">'+ini+img+'</span>';
}

/* ---------- types de produits ---------- */
function isMaisonAisle(a){ return MAISON_AISLES.indexOf(a)>=0; }
function guessType(name, aisle){
  var n=deacc(name);
  if(isMaisonAisle(aisle||guessAisle(name))) return 'maison';
  if(/maizena|farine|sucre|levure|bouillon|(^|\s)sel(\s|$)|poivre|vinaigre/.test(n)) return 'basique';
  if(/oeuf|oignon|(^|\s)ail(\s|$)|echalote|pomme|patate|citron|carotte|courge|butternut|potiron/.test(n)) return 'compte';
  var a=aisle||guessAisle(name);
  if(a===PLACARD) return 'basique';
  if(FRESH_AISLES.indexOf(a)>=0) return 'frais';
  return 'compte';
}
function typeOf(name, aisle){ var nk=norm(name); return (S.types && S.types[nk]) || guessType(name, aisle); }
function skeyOf(nk, unit, type){ return type==='basique' ? nk+'|*' : type==='maison' ? nk+'|m' : nk+'|'+unit; }

/* ---------- état ---------- */
var LS_KEY='cuisine-eva-v2', LS_CHECKS='cuisine-eva-v2-checks', LS_DRAFT='cuisine-eva-v2-draft';
function migrate(s){
  s=s||{};
  s.v=2; s.recipes=s.recipes||[]; s.packs=s.packs||[];
  s.plan=s.plan||{}; s.plan.items=s.plan.items||[]; s.plan.reduce=s.plan.reduce||{}; s.plan.extras=s.plan.extras||[]; s.plan.stamp=s.plan.stamp||'s1';
  s.settings=s.settings||{}; if(s.settings.expAsk==null) s.settings.expAsk=true; s.aisles=s.aisles||{};
  s.theme=s.theme||'rose'; if(s.theme==='noir') s.theme='anthracite';
  if(!s.look || !s.look.bg){ s.look=presetLook(s.theme); s.look.preset=s.theme; } s.favs=s.favs||{}; s.types=s.types||{}; s.stock=s.stock||{};
  return s;
}
var S=null;
try{ S=JSON.parse(lsGet(LS_KEY)); }catch(e){ S=null; }
if(!S || !S.recipes){ S = window.SEED ? clone(window.SEED) : {}; S.createdAt=now(); }
S=migrate(S);

var checks={};
(function(){ var c=null; try{ c=JSON.parse(lsGet(LS_CHECKS)); }catch(e){} if(c && c.stamp===S.plan.stamp) checks=c.keys||{}; })();
function saveChecks(){ lsSet(LS_CHECKS, JSON.stringify({stamp:S.plan.stamp, keys:checks})); }
function save(){ S.updatedAt=now(); lsSet(LS_KEY, JSON.stringify(S)); }

/* ---------- données ---------- */
function getRecipe(id){ for(var i=0;i<S.recipes.length;i++) if(S.recipes[i].id===id) return S.recipes[i]; return null; }
function planFor(rid){ for(var i=0;i<S.plan.items.length;i++) if(S.plan.items[i].recipeId===rid) return S.plan.items[i]; return null; }
function packMap(){ var m={}; S.packs.forEach(function(p){ if(p.name && num(p.size)>0) m[norm(p.name)+'|'+p.unit]=p; }); return m; }
function activeItems(items){ return (items||S.plan.items).filter(function(p){ return !p.cooked; }); }

/* Additionne les ingrédients des recettes, retire ce qui est déjà dans le stock, puis arrondit aux paquets */
function aggregate(items){
  var map={}, order=[], packs=packMap();
  activeItems(items).forEach(function(pi){
    var r=getRecipe(pi.recipeId); if(!r) return;
    var f=(num(pi.servings)||num(r.servings)||1)/(num(r.servings)||1);
    (r.ingredients||[]).forEach(function(ing){
      if(!ing.name || !String(ing.name).trim()) return;
      var b=toBase(num(ing.qty)*f, ing.unit||'pc');
      var nk=norm(ing.name), aisle=(S.aisles&&S.aisles[nk])||ing.aisle||guessAisle(ing.name), type=typeOf(ing.name, aisle);
      var unit = type==='basique' ? '*' : b.u;
      var key=skeyOf(nk, b.u, type);
      var it=map[key];
      if(!it){ it=map[key]={key:key,nk:nk,name:String(ing.name).trim(),aisle:aisle,unit:unit,type:type,qty:0,uses:[]}; order.push(it); }
      if(type!=='basique') it.qty+=b.q;
      it.uses.push({rid:r.id,rname:r.name,piId:pi.id,qty:b.q,servings:num(pi.servings)||num(r.servings)||1});
    });
  });
  order.forEach(function(it){
    var st=S.stock[it.key];
    it.total=it.qty; it.fromStock=0;
    if(it.type==='basique'){
      if(st && st.have) it.covered=true;
      else if(st) it.missing=true;
      else it.unknown=true;
      return;
    }
    var avail=Math.max(0,st?num(st.qty):0);
    var need=it.total-avail;
    it.fromStock=Math.min(avail,it.total);
    if(need<=1e-6){ it.covered=true; return; }
    it.qty=need;
    var p=packs[it.key]; if(p) applyPack(it,p);
  });
  return order;
}
function applyPack(it,p){
  var size=num(p.size), full=Math.floor(it.qty/size+1e-9), rem=it.qty-full*size;
  if(rem<1e-6) rem=0;
  var n, tight=false, reduced=false;
  if(rem===0) n=full;
  else if(full>=1 && rem<=0.1*size){ n=full; tight=true; }
  else n=full+1;
  if(!tight && rem>0 && full>=1 && S.plan.reduce[it.key]){ n=full; reduced=true; }
  it.pack=p; it.size=size; it.n=n; it.full=full; it.rem=rem; it.tight=tight; it.reduced=reduced;
  it.leftover=Math.max(0,n*size-it.qty);
}
function wasteScore(list){ var w=0; list.forEach(function(it){ if(it.pack && it.pack.frais && it.leftover>0) w+=it.leftover/it.size; }); return w; }
function newPacks(before,after){
  var bm={}; before.forEach(function(it){ bm[it.key]=it; });
  var out=[];
  after.forEach(function(it){ if(!it.pack) return; var b=bm[it.key]; var bn=b&&b.pack?b.n:0; if(it.n>bn) out.push((it.n-bn)+' '+plural(it.pack.label,it.n-bn)+' de '+it.name); });
  return out;
}
function antiGaspi(list){
  var base=wasteScore(list), out=[];
  list.forEach(function(it){
    if(!it.pack || !it.pack.frais || it.reduced || it.covered) return;
    if(it.leftover < 0.15*it.size) return;
    var g={it:it, opts:[], tip:TIPS[it.nk]||''};
    if(it.full>=1 && it.rem>0.1*it.size && it.rem<=0.35*it.size){
      var fac=(it.full*it.size)/it.qty;
      var per=it.uses.map(function(u){ return esc(u.rname)+' : '+fmtQty(u.qty*fac,it.unit); }).join(' · ');
      g.opts.push({type:'reduce', html:'Acheter '+it.full+' '+plural(it.pack.label,it.full)+' au lieu de '+it.n+', en mettant un peu moins dans chaque recette ('+per+')'});
    }
    var seen={};
    it.uses.forEach(function(u){
      if(seen[u.piId]) return; seen[u.piId]=1;
      var per=u.qty/u.servings; if(per<=0) return;
      var extra=Math.min(4, Math.floor(it.leftover/per+1e-9));
      if(extra<1) return;
      var sim=S.plan.items.map(function(p){ var c=clone(p); if(c.id===u.piId) c.servings=(num(c.servings)||1)+extra; return c; });
      var after=aggregate(sim), w2=wasteScore(after);
      if(w2 < base-0.05){
        var np=newPacks(list,after).filter(function(s){return s.indexOf(it.name)<0;});
        g.opts.push({type:'boost', pi:u.piId, extra:extra, html:'Faire '+extra+' portion'+(extra>1?'s':'')+' de plus de '+esc(u.rname)+' (à emporter ou à congeler)'+(np.length?' <span class="muted">· il faudra aussi '+esc(np.join(', '))+'</span>':'')});
      }
    });
    S.recipes.forEach(function(r){
      if(planFor(r.id)) return;
      var need=0;
      (r.ingredients||[]).forEach(function(ing){ var b=toBase(num(ing.qty),ing.unit||'pc'); if(norm(ing.name)===it.nk && b.u===it.unit) need+=b.q; });
      if(need<=0 || need>it.leftover*1.15 || need<it.leftover*0.3) return;
      var sim=S.plan.items.concat([{id:'sim',recipeId:r.id,servings:r.servings}]);
      var after=aggregate(sim), w2=wasteScore(after);
      if(w2 < base){
        var np=newPacks(list,after).filter(function(s){return s.indexOf(it.name)<0;});
        g.opts.push({type:'add', rid:r.id, html:'Ajouter '+esc(r.name)+' à la semaine (utilise '+fmtQty(need,it.unit)+')'+(np.length?' <span class="muted">· il faudra aussi '+esc(np.join(', '))+'</span>':'')});
      }
    });
    out.push(g);
  });
  return out;
}

/* Liste de courses complète : recettes + basiques « plus » + articles ajoutés */
function shopModel(){
  var all=aggregate(), covered=[], main=[], plac=[];
  var inList={};
  all.forEach(function(it){
    inList[it.key]=1;
    if(it.covered) covered.push(it);
    else if(it.type==='basique' && it.unknown) plac.push(it);
    else main.push(it);
  });
  vals(S.stock).forEach(function(st){
    if(st.type!=='basique' || inList[st.key]) return;
    if(!st.have) main.push({key:st.key,nk:st.nk,name:st.name,aisle:st.aisle||guessAisle(st.name),unit:'*',type:'basique',qty:0,total:0,fromStock:0,uses:[],auto:true,missing:true});
  });
  vals(S.stock).forEach(function(st){
    if(st.type!=='maison' || st.level==='ok') return;
    main.push({key:st.key,nk:st.nk,name:st.name,aisle:st.aisle||'Entretien',unit:'*',type:'maison',level:st.level,qty:0,total:0,fromStock:0,uses:[],auto:true});
  });
  return {all:all, covered:covered, main:main, plac:plac};
}
function toBuyCount(){
  var n=0; try{ shopModel().main.forEach(function(it){ if(!checks[it.key]) n++; }); S.plan.extras.forEach(function(x){ if(!checks['x:'+x.id]) n++; }); }catch(e){}
  return n;
}

/* ---------- stock ---------- */
function ensureStock(name, unit, type, aisle){
  var nk=norm(name), key=skeyOf(nk, unit, type);
  var st=S.stock[key], existed=!!st;
  if(!st) st=S.stock[key]={key:key,nk:nk,name:String(name).trim(),unit:(type==='basique'||type==='maison')?'*':unit,type:type,qty:0,have:false,low:null,at:now(),aisle:(S.aisles&&S.aisles[nk])||aisle||guessAisle(name)};
  if(type==='maison' && !st.level) st.level='ok';
  return {st:st, existed:existed};
}
function threshold(st){
  if(st.low!=null && st.low!=='') return num(st.low);
  var m=0;
  S.recipes.forEach(function(r){ (r.ingredients||[]).forEach(function(i){ var b=toBase(num(i.qty), i.unit||'pc'); if(norm(i.name)===st.nk && b.u===st.unit) m=Math.max(m,b.q); }); });
  return m;
}
function isLow(st){ if(st.type==='basique' || st.type==='maison') return false; var t=threshold(st); return t>0 && num(st.qty) < t-1e-9; }
function todayISO(add){ var d=new Date(); d.setHours(12,0,0,0); if(add) d.setDate(d.getDate()+add); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function daysUntil(iso){ if(!iso) return null; var d=new Date(iso+'T12:00:00'), t=new Date(); t.setHours(12,0,0,0); return Math.round((d-t)/DAY_MS); }
function fmtDate(iso){ try{ return new Date(iso+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}); }catch(e){ return iso; } }
function expText(iso){ var d=daysUntil(iso); if(d==null) return ''; if(d<0) return 'périmé depuis le '+fmtDate(iso); if(d===0) return 'à consommer aujourd’hui'; if(d===1) return 'à consommer demain'; return 'à consommer avant le '+fmtDate(iso); }
function expPill(iso){ var d=daysUntil(iso); if(d==null) return ''; if(d<0) return '<span class="pill" style="background:#F6B9C6;color:#8A1C33">périmé</span>'; if(d<=2) return '<span class="pill warn">périme bientôt</span>'; return ''; }
var EXP_AISLES = ['Frais & crèmerie','Tofu & protéines'];
function wantsExp(key){
  if(!S.settings || S.settings.expAsk===false) return false;
  var info=null;
  if(key.indexOf('x:')===0){ S.plan.extras.forEach(function(x){ if('x:'+x.id===key && x.skey && S.stock[x.skey]) info={type:S.stock[x.skey].type, aisle:S.stock[x.skey].aisle, skey:x.skey}; }); }
  else { var it=findShopItem(key); if(it) info={type:it.type, aisle:it.aisle, skey:it.key}; }
  if(!info || info.type==='basique' || info.type==='maison') return false;
  var st=S.stock[info.skey];
  if(st && st.askExp!=null) return !!st.askExp;
  return info.type==='frais' || EXP_AISLES.indexOf(info.aisle)>=0;
}
function toCheckList(){
  return vals(S.stock).filter(function(st){
    if(st.type==='basique' || st.type==='maison' || num(st.qty)<=0) return false;
    var age=now()-(st.at||0), du=daysUntil(st.exp);
    return (du!=null && du<=2) || (st.type==='frais' && age>FRESH_DAYS*DAY_MS) || age>CONFIRM_DAYS*DAY_MS;
  }).sort(function(a,b){ return (a.at||0)-(b.at||0); });
}
function lowList(){
  var model=shopModel(), buying={};
  model.main.forEach(function(it){ buying[it.key]=1; });
  return vals(S.stock).filter(function(st){ return isLow(st) && !buying[st.key]; }).sort(function(a,b){ return a.name.localeCompare(b.name,'fr'); });
}
function maisonEvery(st){ return num(st.every) || (MAISON_FAST.test(deacc(st.name))?15:MAISON_CHECK_DAYS); }
function maisonCheckList(){
  return vals(S.stock).filter(function(st){ return st.type==='maison' && st.level==='ok' && now()-(st.at||0)>maisonEvery(st)*DAY_MS; }).sort(function(a,b){ return (a.at||0)-(b.at||0); });
}
function lowExtra(key){ for(var i=0;i<S.plan.extras.length;i++) if(S.plan.extras[i].skey===key) return S.plan.extras[i]; return null; }
function setType(nk, t){
  S.types[nk]=t;
  vals(S.stock).forEach(function(st){
    if(st.nk!==nk || st.type===t) return;
    var wasB = st.type==='basique';
    delete S.stock[st.key];
    st.type=t;
    if(t==='basique'){ st.have = num(st.qty)>0 || !!st.have; st.unit='*'; st.qty=0; }
    else if(wasB){ st.unit='pc'; st.qty = st.have?1:0; }
    st.key=skeyOf(nk, st.unit, t);
    var ex=S.stock[st.key];
    if(ex){ ex.qty=num(ex.qty)+num(st.qty); ex.have=ex.have||st.have; } else S.stock[st.key]=st;
  });
}
function cookPlan(p){
  var r=getRecipe(p.recipeId); if(!r || p.cooked) return;
  var f=(num(p.servings)||num(r.servings)||1)/(num(r.servings)||1), log=[];
  (r.ingredients||[]).forEach(function(ing){
    if(!ing.name) return;
    var type=typeOf(ing.name, ing.aisle); if(type==='basique') return;
    var b=toBase(num(ing.qty)*f, ing.unit||'pc'), key=skeyOf(norm(ing.name), b.u, type), st=S.stock[key];
    if(!st) return;
    var d=Math.min(num(st.qty), b.q); if(d<=0) return;
    st.qty=Math.round((num(st.qty)-d)*1000)/1000; log.push([key,d]);
  });
  p.cooked=now(); p.log=log;
}
/* Ce qui manque dans le stock pour faire une recette */
function hasStock(){ return Object.keys(S.stock).length>0; }
function ingOK(i, f){
  var type=typeOf(i.name,i.aisle), b=toBase(num(i.qty)*f,i.unit||'pc'), st=S.stock[skeyOf(norm(i.name),b.u,type)];
  return !!st && (type==='basique' ? !!st.have : num(st.qty)>=b.q-1e-9);
}
function missingFor(r, servings){
  var f=(num(servings)||num(r.servings)||1)/(num(r.servings)||1), out=[];
  (r.ingredients||[]).forEach(function(i){ if(i.name && !ingOK(i,f)) out.push(i.name); });
  return out;
}
function feasPill(r, servings){
  if(!hasStock()) return '';
  var m=missingFor(r, servings);
  if(!m.length) return '<span class="pill mint">✓ Réalisable</span>';
  return '<span class="pill warn">Il manque '+m.length+'</span>';
}
function uncookPlan(p){
  (p.log||[]).forEach(function(l){ var st=S.stock[l[0]]; if(st) st.qty=num(st.qty)+num(l[1]); });
  delete p.cooked; delete p.log;
}

/* ---------- import d'une liste d'ingrédients ---------- */
var UNIT_RE=/^(kg|g|gr|grammes?|ml|cl|l|litres?|c\.?\s*à\.?\s*s\.?|cas|cs|cuill[eè]res?\s+à\s+soupe|c\.?\s*à\.?\s*c\.?|cac|cc|cuill[eè]res?\s+à\s+caf[eé]|gousses?|pinc[ée]es?|bottes?|bo[iî]tes?|pots?|briques?|tranches?|sachets?)(?=[\s.]|$)\.?\s*/i;
function unitOf(t){
  t=deacc(t).replace(/\s+/g,' ');
  if(/^kg/.test(t))return 'kg'; if(/^(g|gr|gramme)/.test(t))return 'g';
  if(/^ml/.test(t))return 'ml'; if(/^cl/.test(t))return 'cl'; if(/^(l|litre)/.test(t))return 'l';
  if(/^(c\.? ?a\.? ?s|cas|cs|cuill.* soupe)/.test(t))return 'cas';
  if(/^(c\.? ?a\.? ?c|cac|cc|cuill.* cafe)/.test(t))return 'cac';
  if(/^gousse/.test(t))return 'gousse'; if(/^pincee/.test(t))return 'pincee'; if(/^botte/.test(t))return 'botte';
  if(/^(boite|pot|brique)/.test(t))return 'boite'; if(/^tranche/.test(t))return 'tranche'; if(/^sachet/.test(t))return 'sachet';
  return 'pc';
}
function parseLine(line){
  var s=String(line).trim().replace(/^[-•*·–]\s*/,'');
  if(!s) return null;
  s=s.replace(/½/g,'.5').replace(/¼/g,'.25').replace(/¾/g,'.75');
  var qty=null, unit='pc';
  var m=s.match(/^(\d*[.,]?\d+(?:\s*\/\s*\d+)?)\s*/);
  if(m){ qty=num(m[1]); s=s.slice(m[0].length); var u=s.match(UNIT_RE); if(u){ unit=unitOf(u[1]); s=s.slice(u[0].length); } }
  else {
    var m2=s.match(/^(.*?)[\s:,–-]+(\d*[.,]?\d+)\s*([a-zA-Zàéèç. ]*)$/);
    if(m2){ qty=num(m2[2]); var u2=(m2[3]||'').trim(); if(u2 && UNIT_RE.test(u2)) unit=unitOf(u2); s=m2[1]; }
  }
  s=s.replace(/^(de |d'|d’|du |des )/i,'').trim();
  if(!s) return null;
  return {qty: qty==null?1:qty, unit:unit, name:s, aisle:'', type:''};
}

/* ---------- photo de couverture ---------- */
function readPhoto(file, cb){
  var url=URL.createObjectURL(file), img=new Image();
  img.onload=function(){
    var max=900, w=img.naturalWidth, h=img.naturalHeight, k=Math.min(1, max/Math.max(w,h));
    var c=document.createElement('canvas'); c.width=Math.round(w*k); c.height=Math.round(h*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    URL.revokeObjectURL(url);
    try{ cb(c.toDataURL('image/jpeg',0.72)); }catch(e){ cb(null); }
  };
  img.onerror=function(){ URL.revokeObjectURL(url); cb(null); };
  img.src=url;
}

/* ---------- vues ---------- */
var view={filter:'all', tag:'', q:'', serv:{}, confirmDel:null, confirmWeek:false, draft:null, draftFor:null, pasteOpen:false, copyText:'', err:'', sopen:{}, confirmRestore:null, validate:false, vq:{}, stab:'cuisine'};
var root=document.getElementById('root');

function route(){ var h=(location.hash||'').replace(/^#/,''); try{ h=decodeURIComponent(h); }catch(e){} return h||'accueil'; }
function header(){ return '<header class="top"><div class="wrap top-in"><a class="brand" href="#accueil">'+motifSVG('coeur')+'<div>La cuisine <span>d’Eva</span></div></a><a class="icon-btn" href="#reglages" aria-label="Réglages">'+GEAR+'</a></div></header>'; }
function nav(tab){
  var toBuy=toBuyCount();
  var T=[
    ['accueil','Accueil','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/></svg>'],
    ['semaine','Semaine','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>'],
    ['nouvelle','Ajouter','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'],
    ['courses','Courses','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.5l2.2 11h10.6l2-8H7"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>'],
    ['stock','Stock','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h10M8 3.5v3L5.5 9v10.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9L16 6.5v-3"/><path d="M5.5 12h13"/></svg>']
  ];
  return '<nav class="nav" aria-label="Navigation"><div class="wrap">'+T.map(function(t){
    if(t[0]==='nouvelle') return '<a class="tab plus" href="#nouvelle" aria-label="Ajouter une recette"'+(tab==='nouvelle'?' aria-current="page"':'')+'><span>'+t[2]+'</span></a>';
    return '<a class="tab'+(tab===t[0]?' on':'')+'" href="#'+t[0]+'"'+(tab===t[0]?' aria-current="page"':'')+'>'+t[2]+(t[0]==='courses'&&toBuy?'<span class="badge">'+toBuy+'</span>':'')+t[1]+'</a>';
  }).join('')+'</div></nav>';
}
function timePill(m){ return '<span class="pill time">'+CLOCK+esc(m||'?')+' min</span>'; }
function isSunday(){ return new Date().getDay()===0; }
function greeting(){ var h=new Date().getHours(); if(isSunday()) return 'C’est dimanche, on prépare la semaine ?'; if(h<11) return 'Bonjour !'; if(h<18) return 'Coucou !'; return 'Bonsoir !'; }
function favBtn(r){ var on=!!S.favs[r.id]; return '<button class="favb'+(on?' on':'')+'" data-a="fav" data-x="'+r.id+'" aria-pressed="'+on+'" aria-label="'+(on?'Retirer des favorites':'Ajouter aux favorites')+'">'+(on?HEART:HEART_O)+'</button>'; }
function rcardHTML(r){
  var inPlan=!!planFor(r.id);
  return '<div class="card rcard" role="link" tabindex="0" data-a="open" data-x="'+r.id+'"><div class="cover">'+coverHTML(coverOf(r))+favBtn(r)+
    '<button class="btn sm addw '+(inPlan?'mint':'')+'" data-a="toggleplan" data-x="'+r.id+'" aria-pressed="'+inPlan+'">'+(inPlan?'✓ Semaine':'+ Semaine')+'</button></div>'+
    '<div class="body"><h3>'+esc(r.name)+'</h3><div class="row wrapflex">'+feasPill(r)+timePill(r.time)+'<span class="pill ppl">'+PEOPLE+esc(r.servings)+' pers.</span>'+(r.example?'<span class="pill warn">Exemple</span>':'')+'</div></div></div>';
}

/* ---------- installation sur l'écran d'accueil ---------- */
var LS_INSTALL='cuisine-eva-install-hide';
var installEvt=null;
/* Demande au téléphone de ne pas effacer les données de l'appli en cas de manque de place */
try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(function(p){ if(!p) navigator.storage.persist(); }); }catch(e){}
window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); installEvt=e; try{ render(); }catch(err){} });
window.addEventListener('appinstalled', function(){ installEvt=null; lsSet(LS_INSTALL,'1'); try{ render(); }catch(err){} });
function isInstalled(){ try{ return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true; }catch(e){ return false; } }
function inFrame(){ try{ return window.self!==window.top; }catch(e){ return true; } }
function platform(){
  var ua=navigator.userAgent||'';
  if(/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints>1)) return 'ios';
  if(/android/i.test(ua)) return 'android';
  return 'ordi';
}
var SHARE_ICO='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-4px"><path d="M12 15V3.5M8 7.5l4-4 4 4"/><path d="M7 10.5H5.5v10h13v-10H17"/></svg>';
var PLUS_ICO='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-4px"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>';
function installSteps(){
  var p=platform();
  if(installEvt) return '<button class="btn primary block" data-a="install">Installer l’appli</button>';
  if(p==='ios') return '<ol class="isteps"><li>Ouvre ce lien dans <b>Safari</b>.</li><li>Touche le bouton <b>Partager</b> '+SHARE_ICO+' en bas de l’écran.</li><li>Fais défiler et choisis <b>« Sur l’écran d’accueil »</b> '+PLUS_ICO+', puis <b>Ajouter</b>.</li></ol>';
  if(p==='android') return '<ol class="isteps"><li>Ouvre ce lien dans <b>Chrome</b>.</li><li>Touche le menu <b>⋮</b> en haut à droite.</li><li>Choisis <b>« Installer l’application »</b> (ou « Ajouter à l’écran d’accueil »).</li></ol>';
  return '<div class="small muted">Ouvre ce lien sur ton téléphone pour l’installer sur l’écran d’accueil.</div>';
}
function installCard(){
  if(isInstalled() || inFrame() || lsGet(LS_INSTALL)) return '';
  return '<div class="card stack install"><div class="row" style="gap:12px"><img src="icons/icon-192.png" alt="" width="52" height="52" style="border-radius:14px;flex:none"><div><h2>Installe l’appli</h2><div class="small muted">Une icône sur ton écran d’accueil, en plein écran, même sans connexion. Ça prend 10 secondes.</div></div></div>'+installSteps()+'<button class="btn ghost sm" data-a="installhide">Plus tard</button></div>';
}

function vHome(){
  var tags={}; S.recipes.forEach(function(r){ (r.tags||[]).forEach(function(t){ if(t) tags[t]=1; }); });
  var h='<div><div class="hello">'+greeting()+'</div><h1>Mes recettes</h1></div>'+installCard();
  var tc=toCheckList().length, low=lowList().length;
  if(tc && (isSunday() || toCheckList().some(function(st){return st.type==='frais';}))) h+='<a class="banner" href="#semaine" style="text-decoration:none;display:block">Il te reste encore '+(tc>1?tc+' produits frais ou à vérifier':'un produit à vérifier')+' ? Fais le point dans « Semaine » ›</a>';
  else if(isSunday() && low) h+='<a class="banner" href="#semaine" style="text-decoration:none;display:block">'+low+' produit'+(low>1?'s':'')+' bientôt épuisé'+(low>1?'s':'')+'. Fais le point dans « Semaine » ›</a>';
  if(S.recipes.some(function(r){return r.example;})) h+='<div class="banner">Les recettes marquées « Exemple » sont là pour tester. Supprime-les quand tu veux.</div>';
  var favs=S.recipes.filter(function(r){return S.favs[r.id];});
  h+='<section class="stack"><h2>Mes favorites</h2>'+(favs.length?'<div class="favrow">'+favs.map(rcardHTML).join('')+'</div>':'<div class="small muted">Touche le cœur d’une recette pour la retrouver ici.</div>')+'</section>';
  var items=S.plan.items.slice().sort(function(a,b){ return (a.cooked?1:0)-(b.cooked?1:0) || (a.day||8)-(b.day||8); });
  h+='<section class="stack"><div class="row between"><h2>Ma semaine</h2>'+(items.length?'<a class="btn sm" href="#semaine">Tout voir</a>':'')+'</div>';
  if(!items.length) h+='<div class="small muted">Rien de prévu pour l’instant : ajoute des recettes avec « + Semaine ».</div>';
  else h+='<div class="card">'+items.slice(0,3).map(function(p){ var r=getRecipe(p.recipeId); if(!r) return ''; return '<div class="prow'+(p.cooked?' cooked':'')+'">'+miniCover(r)+'<div class="nm"><a href="#recette-'+r.id+'">'+esc(r.name)+'</a><div class="row wrapflex" style="margin-top:4px">'+(p.day?'<span class="pill">'+DAYS[p.day]+'</span>':'')+(p.cooked?'<span class="pill mint">Cuisinée ✓</span>':timePill(r.time))+'</div></div></div>'; }).join('')+(items.length>3?'<div class="small muted" style="padding-top:8px">et '+(items.length-3)+' autre'+(items.length>4?'s':'')+'…</div>':'')+'</div>';
  h+='</section>';
  h+='<section class="stack"><h2>Toutes mes recettes</h2><input class="search" id="q" type="search" placeholder="Chercher une recette ou un ingrédient" value="'+esc(view.q)+'" aria-label="Chercher">';
  h+='<div class="chips" role="group" aria-label="Filtres">'+
    [['all','Toutes'],['fav','♡ Favorites'],['20','≤ 20 min'],['30','≤ 30 min'],['plan','Dans ma semaine']].map(function(f){ return '<button class="chip'+(view.filter===f[0]&&!view.tag?' on':'')+'" data-a="filter" data-x="'+f[0]+'">'+f[1]+'</button>'; }).join('')+
    Object.keys(tags).sort().map(function(t){ return '<button class="chip'+(view.tag===t?' on':'')+'" data-a="tag" data-x="'+esc(t)+'">'+esc(t)+'</button>'; }).join('')+'</div>';
  h+='<div class="list" id="list">'+listHTML()+'</div></section>';
  return h;
}
function listHTML(){
  var q=deacc(view.q.trim());
  var rs=S.recipes.filter(function(r){
    if(view.tag) { if((r.tags||[]).indexOf(view.tag)<0) return false; }
    else if(view.filter==='fav' && !S.favs[r.id]) return false;
    else if(view.filter==='20' && num(r.time)>20) return false;
    else if(view.filter==='30' && num(r.time)>30) return false;
    else if(view.filter==='plan' && !planFor(r.id)) return false;
    if(q){ var hay=deacc(r.name+' '+(r.tags||[]).join(' ')+' '+(r.ingredients||[]).map(function(i){return i.name;}).join(' ')); if(hay.indexOf(q)<0) return false; }
    return true;
  });
  if(!rs.length) return '<div class="card empty">'+motifSVG('champignon')+(S.recipes.length?'Aucune recette ne correspond.':'Pas encore de recette. Appuie sur le + en bas.')+'</div>';
  return rs.map(rcardHTML).join('');
}

function vDetail(id){
  var r=getRecipe(id); if(!r) return notFound();
  var pi=planFor(id);
  var sv=view.serv[id] || (pi?num(pi.servings):num(r.servings)) || 1;
  var f=sv/(num(r.servings)||1);
  var h='<a class="back" href="#accueil">‹ Recettes</a>';
  h+='<div class="card detail-card"><div class="cover big">'+coverHTML(coverOf(r))+favBtn(r)+'</div><div class="in"><h1>'+esc(r.name)+'</h1><div class="row wrapflex">'+timePill(r.time)+(r.tags||[]).map(function(t){return '<span class="pill">'+esc(t)+'</span>';}).join('')+(r.example?'<span class="pill warn">Exemple</span>':'')+'</div>';
  if(hasStock()){
    var miss=missingFor(r, sv);
    h+= miss.length ? '<div class="banner"><b>Il manque '+miss.length+' ingrédient'+(miss.length>1?'s':'')+'</b> pour '+sv+' pers. : '+esc(miss.map(function(s){return s.toLowerCase();}).join(', '))+'.</div>'
      : '<div class="banner" style="background:var(--mint);color:var(--mint-ink)"><b>✓ Réalisable</b> avec ce que tu as en stock.</div>';
  }
  if(r.link) h+='<a class="btn" href="'+esc(r.link)+'" target="_blank" rel="noopener">▶ Voir la vidéo</a>';
  h+='<div class="row between"><span class="muted small">Portions</span><span class="stepper"><button class="icon-btn" data-a="serv" data-x="'+id+'" data-y="-1" aria-label="Une portion de moins">−</button><span>'+sv+' pers.</span><button class="icon-btn" data-a="serv" data-x="'+id+'" data-y="1" aria-label="Une portion de plus">+</button></span></div>';
  if(pi) h+='<div class="row wrapflex"><span class="pill mint">Dans ta semaine · '+num(pi.servings)+' pers.</span>'+(num(pi.servings)!==sv?'<button class="btn sm" data-a="addplan" data-x="'+id+'">Passer à '+sv+' pers.</button>':'')+'<button class="btn sm ghost" data-a="toggleplan" data-x="'+id+'">Retirer</button></div>';
  else h+='<button class="btn primary block" data-a="addplan" data-x="'+id+'">Ajouter à ma semaine ('+sv+' pers.)</button>';
  h+='</div></div>';
  h+='<div class="card"><h2 style="margin-bottom:6px">Ingrédients</h2>'+(r.ingredients||[]).map(function(i){
    var b=toBase(num(i.qty)*f,i.unit||'pc'), ok=ingOK(i,f);
    var tag = !hasStock() ? '' : ok ? ' <span class="pill mint">en stock</span>' : ' <span class="pill warn">à acheter</span>';
    return '<div class="ing"><span class="nm">'+icoHTML(i.name,true)+'<span>'+esc(cap(i.name))+tag+'</span></span><b>'+fmtQty(b.q,b.u)+'</b></div>';
  }).join('')+'</div>';
  if((r.steps||[]).length) h+='<div class="card"><h2 style="margin-bottom:12px">Étapes</h2><ol class="steps">'+r.steps.map(function(s){return '<li><span>'+esc(s)+'</span></li>';}).join('')+'</ol></div>';
  if(r.notes) h+='<div class="card" style="background:var(--butter);border-color:#F7E08A;box-shadow:0 4px 0 #F2D466"><h3 style="margin-bottom:6px">Mes notes</h3><div>'+esc(r.notes).replace(/\n/g,'<br>')+'</div></div>';
  h+='<div class="row"><a class="btn" href="#modifier-'+id+'">Modifier</a>'+(view.confirmDel===id?'<button class="btn danger" data-a="del" data-x="'+id+'">Oui, supprimer</button><button class="btn ghost" data-a="delcancel">Annuler</button>':'<button class="btn ghost" data-a="delask" data-x="'+id+'">Supprimer</button>')+'</div>';
  return h;
}
function notFound(){ return '<div class="card empty">'+motifSVG('oeuf')+'Cette recette n’existe plus.<a class="btn" href="#accueil">Retour aux recettes</a></div>'; }

function blankDraft(){ return {id:null,name:'',time:20,servings:2,link:'',tags:[],ingredients:[{qty:'',unit:'g',name:'',aisle:'',type:''},{qty:'',unit:'g',name:'',aisle:'',type:''}],steps:[],notes:'',cover:null}; }
function loadDraft(key){ try{ var d=JSON.parse(lsGet(LS_DRAFT)); if(d && d.key===key) return d.draft; }catch(e){} return null; }
function storeDraft(){ if(view.draftFor) lsSet(LS_DRAFT, JSON.stringify({key:view.draftFor, draft:view.draft})); }
function coverEditor(d){
  var auto=!(d.cover && (d.cover.photo || (d.cover.motifs&&d.cover.motifs.length)));
  var c=coverOf(d), sel=auto?[]:(d.cover.motifs||[]);
  var h='<div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="row between"><h2>Couverture</h2>'+(auto?'<span class="pill mint">Choisie pour toi</span>':'<button class="btn sm" data-a="coverauto">Automatique</button>')+'</div>';
  h+='<div class="cover prev">'+coverHTML(c)+'</div>';
  if(!c.photo){
    h+='<div class="small muted">Choisis 1 ou 2 dessins pour ton bandeau :</div><div class="mgrid">'+MOTIF_KEYS.map(function(k){
      var ix=sel.indexOf(k);
      return '<button class="mtile'+(ix>=0?' on':'')+'" style="background:'+MOTIFS[k].bg+'" data-a="motif" data-x="'+k+'" aria-pressed="'+(ix>=0)+'" aria-label="'+MOTIFS[k].label+'">'+motifSVG(k)+(ix>=0?'<span class="n">'+(ix+1)+'</span>':'')+'</button>';
    }).join('')+'</div>';
    h+='<div class="small muted">Couleur du fond :</div><div class="swatches">'+BGS.map(function(b){ return '<button class="sw'+(String(c.bg).toUpperCase()===b?' on':'')+'" style="background:'+b+'" data-a="coverbg" data-x="'+b+'" aria-label="Fond '+b+'"></button>'; }).join('')+'</div>';
  }
  h+='<div class="row wrapflex"><label class="btn filebtn">'+(c.photo?'Changer la photo':'Mettre une photo')+'<input type="file" accept="image/*" id="coverfile"></label>'+(c.photo?'<button class="btn ghost" data-a="coverphotodel">Retirer la photo</button>':'')+'</div></div>';
  return h;
}
function vEdit(id){
  var r=id?getRecipe(id):null; if(id && !r) return notFound();
  var key=id||'new';
  if(view.draftFor!==key){
    view.draft=loadDraft(key);
    if(!view.draft){ view.draft = r ? clone(r) : blankDraft(); view.draft.ingredients.forEach(function(i){ if(!i.type) i.type = (i.name && S.types[norm(i.name)]) || ''; }); }
    view.draftFor=key; view.err=''; view.pasteOpen=false;
  }
  var d=view.draft;
  var unitOpts=function(sel){ return UNITS.map(function(u){return '<option value="'+u[0]+'"'+(u[0]===sel?' selected':'')+'>'+u[1]+'</option>';}).join(''); };
  var aisleOpts=function(sel){ return '<option value="">Rayon : auto</option>'+AISLES.map(function(a){return '<option'+(a===sel?' selected':'')+'>'+esc(a)+'</option>';}).join(''); };
  var typeOpts=function(i){ var g=i.name?TYPE_LABEL[guessType(i.name,i.aisle)]:''; return '<option value="">Type : auto'+(g?' ('+g+')':'')+'</option>'+TYPES.map(function(t){return '<option value="'+t[0]+'"'+(t[0]===i.type?' selected':'')+'>'+t[1]+'</option>';}).join(''); };
  var h='<a class="back" href="'+(id?'#recette-'+id:'#accueil')+'" data-a="canceledit">‹ Annuler</a><h1>'+(id?'Modifier la recette':'Nouvelle recette')+'</h1>';
  h+='<div class="card" style="display:flex;flex-direction:column;gap:12px">';
  h+='<label class="f" for="f-name">Nom<input class="inp" id="f-name" data-f="name" value="'+esc(d.name)+'" placeholder="Ex. : Gnocchis crousti au pesto"></label>';
  h+='<div class="grid3"><label class="f" for="f-time">Temps total (min)<input class="inp" id="f-time" data-f="time" inputmode="numeric" value="'+esc(d.time)+'"></label><label class="f" for="f-serv">Pour combien de personnes<input class="inp" id="f-serv" data-f="servings" inputmode="numeric" value="'+esc(d.servings)+'"></label></div>';
  h+='<label class="f" for="f-link">Lien de la vidéo TikTok<input class="inp" id="f-link" data-f="link" type="url" value="'+esc(d.link)+'" placeholder="https://www.tiktok.com/…"></label>';
  h+='<label class="f" for="f-tags">Catégories (séparées par des virgules)<input class="inp" id="f-tags" data-f="tags" value="'+esc((d.tags||[]).join(', '))+'" placeholder="Pâtes, Rapide, Batch"></label></div>';
  h+='<div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="row between"><h2>Ingrédients</h2><button class="btn sm" data-a="pastetoggle">Coller une liste</button></div>';
  h+='<div class="small muted">Le type sert au stock : <b>Compté</b> (pâtes, conserves, œufs), <b>Basique</b> (huile, sel, épices), <b>Frais</b> (légumes, herbes, crèmerie). En « auto », l’appli devine.</div>';
  if(view.pasteOpen) h+='<div style="display:flex;flex-direction:column;gap:8px"><label class="f" for="paste">Colle la liste (une ligne par ingrédient, ex. « 200 g de feta »)<textarea class="inp" id="paste" placeholder="200 g de feta&#10;1 boîte de pois chiches&#10;2 c. à s. de sauce soja"></textarea></label><button class="btn primary" data-a="pasteapply">Ajouter ces ingrédients</button></div>';
  h+='<div class="ingedit">'+d.ingredients.map(function(i,ix){
    return '<div class="one"><div class="irow"><input class="inp" aria-label="Quantité" data-f="ing" data-i="'+ix+'" data-k="qty" inputmode="decimal" value="'+esc(i.qty)+'" placeholder="Qté"><select class="inp" aria-label="Unité" data-f="ing" data-i="'+ix+'" data-k="unit">'+unitOpts(i.unit||'pc')+'</select><input class="inp" aria-label="Ingrédient" data-f="ing" data-i="'+ix+'" data-k="name" value="'+esc(i.name)+'" placeholder="Ingrédient"><button class="icon-btn" data-a="ingdel" data-x="'+ix+'" aria-label="Retirer cet ingrédient">×</button></div>'+
      '<div class="irow2"><select class="inp" aria-label="Rayon" data-f="ing" data-i="'+ix+'" data-k="aisle">'+aisleOpts(i.aisle||'')+'</select><select class="inp" aria-label="Type de produit" data-f="ing" data-i="'+ix+'" data-k="type">'+typeOpts(i)+'</select></div></div>';
  }).join('')+'</div><button class="btn" data-a="ingadd">+ Ingrédient</button></div>';
  h+='<div class="card" style="display:flex;flex-direction:column;gap:12px"><label class="f" for="f-steps">Étapes (une par ligne)<textarea class="inp" id="f-steps" data-f="steps" placeholder="Préchauffer le four…">'+esc((d.steps||[]).join('\n'))+'</textarea></label>';
  h+='<label class="f" for="f-notes">Mes notes<textarea class="inp" id="f-notes" data-f="notes" style="min-height:70px" placeholder="Ex. : mettre moins de piment">'+esc(d.notes||'')+'</textarea></label></div>';
  h+=coverEditor(d);
  if(view.err) h+='<div class="err" role="alert">'+esc(view.err)+'</div>';
  h+='<button class="btn primary block" data-a="saverecipe">Enregistrer la recette</button>';
  return h;
}
function miniCover(r){ var c=coverOf(r); if(c.photo) return '<span class="mini"><img src="'+c.photo+'" alt=""></span>'; return '<span class="mini" style="background:'+esc(c.bg||MOTIFS[c.motifs[0]].bg)+';padding:5px">'+motifSVG(c.motifs[0])+'</span>'; }

function sundayHTML(){
  var tc=toCheckList(), low=lowList(), mc=maisonCheckList();
  if(!tc.length && !low.length && !mc.length) return '<div class="card ok-card">'+motifSVG('fraise')+'<span>Ton stock est à jour, rien à vérifier.</span></div>';
  var h='<div class="card sunday stack"><h2>'+motifSVG('oeuf')+'Vérification du dimanche</h2>';
  if(tc.length){
    h+='<h3>À vérifier</h3><div class="small muted">L’appli ne peut pas tout deviner : dis-lui ce qu’il reste vraiment.</div><div>'+tc.map(function(st){
      return '<div class="qrow"><div class="q">'+icoHTML(st.name,true)+'<span>Il reste combien de '+esc(st.name.toLowerCase())+' ?</span></div><div class="small muted">L’appli pense : '+fmtQty(num(st.qty),st.unit)+' · acheté'+(st.type==='frais'?'':' ou vérifié')+' '+agoText(st.at)+'</div>'+
        '<div class="a"><input type="text" inputmode="decimal" id="ans-'+esc(st.key)+'" aria-label="Quantité restante" placeholder="'+esc(fmtNum(num(st.qty)))+'"><span class="small muted">'+esc(unitLabel(st.unit))+'</span><button class="btn sm primary" data-a="ansnum" data-x="'+esc(st.key)+'">OK</button><button class="btn sm" data-a="ansnone" data-x="'+esc(st.key)+'">Plus du tout</button><button class="btn sm mint" data-a="ansok" data-x="'+esc(st.key)+'">C’est bon</button></div></div>';
    }).join('')+'</div>';
  }
  if(mc.length){
    h+='<h3 style="margin-top:6px">Côté maison</h3><div class="small muted">Pas mis à jour depuis un moment (15 jours ou 1 mois selon le produit, réglable dans ses options) : où en es-tu ?</div><div>'+mc.map(function(st){
      return '<div class="qrow"><div class="q" style="justify-content:space-between"><span class="row">'+icoHTML(st.name,true)+'<span>'+esc(cap(st.name))+'</span></span><span class="row">'+levelPill(st)+'<button class="btn sm mint" data-a="level" data-x="'+esc(st.key)+'" data-y="ok">C’est bon</button></span></div></div>';
    }).join('')+'</div>';
  }
  if(low.length){
    h+='<h3 style="margin-top:6px">Bientôt épuisés</h3><div class="small muted">Il en reste moins que ce que demande ta recette la plus gourmande.</div><div>'+low.map(function(st){
      var on=!!lowExtra(st.key);
      return '<div class="item"><button class="check'+(on?' on':'')+'" data-a="lowadd" data-x="'+esc(st.key)+'" aria-pressed="'+on+'" aria-label="Ajouter '+esc(st.name)+' à la liste"></button>'+icoHTML(st.name,true)+'<div class="txt"><div class="l1"><b>'+esc(cap(st.name))+'</b><span class="qty">'+(num(st.qty)>0?'reste '+fmtQty(num(st.qty),st.unit):'épuisé')+'</span></div><div class="l2">'+(on?'dans ta liste de courses':'ajouter à la liste')+'</div></div></div>';
    }).join('')+'</div>';
  }
  h+='</div>';
  return h;
}
function vWeek(){
  var items=S.plan.items.slice().sort(function(a,b){ return (a.cooked?1:0)-(b.cooked?1:0) || (a.day||8)-(b.day||8); });
  var total=0, portions=0; items.forEach(function(p){ var r=getRecipe(p.recipeId); if(r){ total+=num(r.time); portions+=num(p.servings); } });
  var h='<h1>Ma semaine</h1>';
  if(!items.length){
    h+='<div class="card empty">'+motifSVG('avocat')+'Aucun repas prévu pour l’instant.<br>Choisis tes recettes avec « + Semaine ».<a class="btn primary" href="#accueil">Choisir mes recettes</a></div>';
    return h+sundayHTML();
  }
  var hh=Math.floor(total/60), mm=total%60;
  h+='<div class="stats"><div class="stat"><b>'+items.length+'</b><span>repas</span></div><div class="stat"><b>'+portions+'</b><span>portions</span></div><div class="stat"><b>'+(hh?hh+' h '+(mm?String(mm).padStart(2,'0'):''):mm+' min')+'</b><span>en cuisine</span></div></div>';
  h+='<div class="card">'+items.map(function(p){
    var r=getRecipe(p.recipeId); if(!r) return '';
    var cook = p.cooked ? '<span class="pill mint">Cuisinée ✓</span><button class="linkbtn" data-a="uncook" data-x="'+p.id+'">annuler</button>'
      : '<button class="btn sm mint" data-a="cook" data-x="'+p.id+'">Je l’ai cuisinée</button>';
    return '<div class="prow'+(p.cooked?' cooked':'')+'">'+miniCover(r)+
      '<div class="nm"><div class="row between" style="align-items:flex-start"><a href="#recette-'+r.id+'">'+esc(r.name)+'</a><button class="icon-btn" style="width:28px;height:28px;font-size:15px" data-a="pdel" data-x="'+p.id+'" aria-label="Retirer de la semaine">×</button></div>'+
      (p.cooked?'':'<div class="row wrapflex" style="margin-top:6px;gap:8px"><select class="day" aria-label="Jour" data-f="day" data-i="'+p.id+'">'+DAYS.map(function(d,ix){return '<option value="'+ix+'"'+(ix===(p.day||0)?' selected':'')+'>'+d+'</option>';}).join('')+'</select>'+
      '<span class="stepper"><button class="icon-btn" data-a="pserv" data-x="'+p.id+'" data-y="-1" aria-label="Une portion de moins">−</button><span>'+num(p.servings)+' pers.</span><button class="icon-btn" data-a="pserv" data-x="'+p.id+'" data-y="1" aria-label="Une portion de plus">+</button></span><span class="pill time">'+CLOCK+esc(r.time)+' min</span></div>')+
      '<div class="row wrapflex" style="margin-top:8px">'+cook+'</div></div></div>';
  }).join('')+'</div>';
  h+=sundayHTML();
  h+='<a class="btn primary block" href="#courses">Voir ma liste de courses</a>';
  h+= view.confirmWeek ? '<div class="card row wrapflex between"><span>Vider la semaine et la liste ? Ton stock est gardé.</span><span class="row"><button class="btn danger sm" data-a="newweek">Oui, vider</button><button class="btn ghost sm" data-a="newweekcancel">Annuler</button></span></div>'
    : '<button class="btn ghost block" data-a="newweekask">Commencer une nouvelle semaine</button>';
  return h;
}

function buyAmount(it){
  if(it.pack) return it.n*it.size;
  if(COUNT[it.unit]) return Math.max(1,Math.ceil(it.qty-1e-9));
  return it.qty>0?Math.round(it.qty*100)/100:1;
}
function buyText(it){
  if(it.type==='maison') return it.level==='out'?'fini':'bientôt fini';
  if(it.type==='basique') return it.missing?'à racheter':'';
  if(it.pack) return it.n+' '+plural(it.pack.label,it.n)+' de '+fmtQty(it.size,it.unit);
  if(COUNT[it.unit]) return fmtQty(Math.ceil(it.qty-1e-9),it.unit);
  return fmtQty(it.qty,it.unit);
}
function instockHTML(key, unit){
  var chk=checks[key]; if(!chk || chk.added==null) return '';
  return '<div class="instock"><span>✓ En stock :</span><input type="text" inputmode="decimal" data-f="added" data-i="'+esc(key)+'" value="'+esc(fmtNum(num(chk.added)).replace('½','.5').replace('¼','.25').replace('¾','.75'))+'" aria-label="Quantité achetée"><span>'+esc(unitLabel(unit))+'</span></div>';
}
function itemHTML(it){
  var on=!!checks[it.key];
  var uses=it.uses.map(function(u){return u.rname;}).filter(function(v,i,a){return a.indexOf(v)===i;});
  var sub=[];
  if(it.type==='maison') sub.push('inventaire maison');
  else if(it.type==='basique'){ if(it.auto) sub.push('marqué « plus » dans ton stock'); }
  else{
    if(it.fromStock>0) sub.push('déjà '+fmtQty(it.fromStock,it.unit)+' en stock');
    if(it.qty>0 && (it.pack || (COUNT[it.unit] && Math.abs(Math.ceil(it.qty-1e-9)-it.qty)>1e-6))) sub.push('il te faut '+fmtQty(it.qty,it.unit));
  }
  if(uses.length) sub.push(uses.join(', '));
  var chips='';
  if(it.pack){
    if(it.reduced) chips+='<span class="pill warn">Quantités un peu réduites</span><button class="linkbtn" data-a="unreduce" data-x="'+esc(it.key)+'">annuler</button>';
    else if(it.tight) chips+='<span class="pill mint">Un poil juste, ça passe</span>';
    else if(it.leftover===0 && uses.length>1) chips+='<span class="pill mint">'+uses.length+' recettes finissent pile '+(it.n>1?'les '+it.n+' '+plural(it.pack.label,it.n):'le '+it.pack.label)+'</span>';
    else if(it.leftover===0) chips+='<span class="pill mint">Rien à jeter</span>';
    else if(it.pack.frais && it.leftover>=0.15*it.size) chips+='<span class="pill warn">Reste '+fmtQty(it.leftover,it.unit)+'</span>';
    else if(it.leftover>0) chips+='<span class="pill plain">Reste '+fmtQty(it.leftover,it.unit)+' (se garde)</span>';
  }
  if(it.type!=='maison'){
    if(view.aisleFor===it.key) chips+='<select class="aisle-pick" data-f="setaisle" data-i="'+esc(it.nk)+'" aria-label="Rayon">'+AISLES.filter(function(x){return !isMaisonAisle(x);}).map(function(x){return '<option'+(x===it.aisle?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select>';
    else chips+='<button class="linkbtn" data-a="aislepick" data-x="'+esc(it.key)+'">changer de rayon</button>';
  }
  if(!it.pack && it.type!=='basique' && it.type!=='maison' && (it.unit==='g'||it.unit==='ml') && it.aisle!==PLACARD){
    chips+='<button class="linkbtn" data-a="setpack" data-x="'+esc(it.name)+'" data-y="'+it.unit+'">Indiquer la taille du paquet</button>';
  }
  return '<div class="item'+(on?' done':'')+'"><button class="check'+(on?' on':'')+'" data-a="check" data-x="'+esc(it.key)+'" aria-pressed="'+on+'" aria-label="Cocher '+esc(it.name)+'"></button>'+icoHTML(it.name)+'<div class="txt"><div class="l1"><b>'+esc(cap(it.name))+'</b><span class="qty">'+esc(buyText(it))+'</span></div><div class="l2">'+esc(sub.join(' · '))+'</div>'+(chips?'<div class="chiprow">'+chips+'</div>':'')+(on&&chkInfo(it.key).exp?'<div class="l2">📅 '+esc(expText(chkInfo(it.key).exp))+' · <button class="linkbtn" data-a="expopen" data-x="'+esc(it.key)+'">modifier</button></div>':'')+'</div></div>';
}
function extraHTML(x){
  var k='x:'+x.id, on=!!checks[k], st=x.skey?S.stock[x.skey]:null;
  return '<div class="item'+(on?' done':'')+'"><button class="check'+(on?' on':'')+'" data-a="check" data-x="'+esc(k)+'" aria-pressed="'+on+'" aria-label="Cocher '+esc(x.name)+'"></button>'+icoHTML(x.name)+'<div class="txt"><div class="l1"><b>'+esc(cap(x.name))+'</b><button class="linkbtn" data-a="xdel" data-x="'+x.id+'">retirer</button></div><div class="l2">'+(st?'bientôt épuisé dans ton stock':'ajouté à la main')+'</div></div></div>';
}
function vShop(){
  var m=shopModel(), list=m.all;
  var h='<div class="row between"><h1>Courses</h1>'+(m.main.length||m.plac.length||S.plan.extras.length?'<button class="btn sm" data-a="copy">Copier la liste</button>':'')+'</div>';
  if(view.copyText) h+='<div class="card copybox" style="display:flex;flex-direction:column;gap:8px"><span class="small muted">Sélectionne le texte puis copie-le :</span><textarea class="inp" readonly id="copybox">'+esc(view.copyText)+'</textarea><button class="btn sm" data-a="copyclose">Fermer</button></div>';
  if(!S.plan.items.length && !m.main.length && !S.plan.extras.length) h+='<div class="card empty">'+motifSVG('carotte')+'Ta liste se remplit toute seule quand tu ajoutes des recettes à ta semaine.<a class="btn primary" href="#accueil">Choisir mes recettes</a></div>';
  if(m.main.length || S.plan.extras.length) h+='<div class="small muted">Coche ce que tu mets dans ton panier. À la fin, valide tes courses : ton stock se met à jour d’un coup.</div>';
  if(activeItems().length){
    var g=antiGaspi(list);
    if(g.length){
      h+='<div class="card gaspi" style="display:flex;flex-direction:column;gap:10px"><h2>'+motifSVG('citron')+'Anti-gaspi</h2><span class="small">Des paquets seront entamés et risquent de finir à la poubelle. Choisis une option si ça te va :</span>';
      g.forEach(function(x){
        var it=x.it;
        h+='<div class="g"><p><b>'+esc(cap(it.name))+'</b> : il te faut '+fmtQty(it.qty,it.unit)+', donc '+it.n+' '+plural(it.pack.label,it.n)+' de '+fmtQty(it.size,it.unit)+'. Il en resterait <b>'+fmtQty(it.leftover,it.unit)+'</b>.</p>';
        if(x.opts.length) h+='<div class="opts">'+x.opts.map(function(o){
          var btn = o.type==='reduce' ? '<button class="btn sm primary" data-a="reduce" data-x="'+esc(it.key)+'">Choisir</button>'
            : o.type==='boost' ? '<button class="btn sm primary" data-a="boost" data-x="'+o.pi+'" data-y="'+o.extra+'">Choisir</button>'
            : '<button class="btn sm primary" data-a="addrec" data-x="'+o.rid+'">Ajouter</button>';
          return '<div class="opt"><span class="t">'+o.html+'</span>'+btn+'</div>';
        }).join('')+'</div>';
        if(x.tip) h+='<p class="small muted">Sinon : '+esc(x.tip)+'</p>';
        h+='</div>';
      });
      h+='</div>';
    }
  }
  if(m.main.length || S.plan.extras.length){
    var done=m.main.filter(function(it){return checks[it.key];}).length + S.plan.extras.filter(function(x){return checks['x:'+x.id];}).length;
    var tot=m.main.length+S.plan.extras.length;
    h+='<div class="small muted">'+done+' / '+tot+' dans le panier</div>';
  }
  AISLES.forEach(function(a,ai){
    var its=m.main.filter(function(it){return it.aisle===a;});
    var ex=S.plan.extras.filter(function(x){return (x.aisle||'Autre')===a;});
    if(!its.length && !ex.length) return;
    its.sort(function(x,y){ return x.name.localeCompare(y.name,'fr'); });
    h+='<section class="card aisle"><h3><i style="background:'+AISLE_COL[ai]+'"></i>'+esc(a)+'</h3>'+its.map(itemHTML).join('')+ex.map(extraHTML).join('')+'</section>';
  });
  if(m.plac.length){
    h+='<section class="card aisle"><h3><i style="background:'+AISLE_COL[8]+'"></i>À vérifier dans tes placards</h3><div class="small muted" style="margin-bottom:4px">Coche ce que tu as déjà (ou que tu achètes) : l’appli s’en souviendra.</div>'+m.plac.map(itemHTML).join('')+'</section>';
  }
  if(m.covered.length){
    h+='<div class="card ok-card">'+motifSVG('fraise')+'<span>Déjà dans ton stock, pas besoin d’en racheter : '+esc(m.covered.map(function(it){return it.name.toLowerCase();}).join(', '))+'.</span></div>';
  }
  var vr=validationRows();
  if(view.validate && vr.length){
    var left=m.main.filter(function(it){return !checks[it.key];}).length+S.plan.extras.filter(function(x){return !checks['x:'+x.id];}).length;
    h+='<div class="card stack" id="valid" style="border-color:var(--accent)"><h2>Valider mes courses</h2><div class="small muted">Vérifie les quantités achetées (change-les si le paquet était différent), puis mets ton stock à jour.</div><div>'+vr.map(function(r){
      var right = r.def==null ? '<span class="pill mint">'+(r.type==='basique'||r.type==='maison'?'j’en ai':'acheté')+'</span>'
        : '<span class="qtyedit"><input type="text" inputmode="decimal" data-f="vq" data-i="'+esc(r.k)+'" value="'+esc(view.vq[r.k]!=null?view.vq[r.k]:String(Math.round(r.def*100)/100).replace('.',','))+'" aria-label="Quantité achetée de '+esc(r.name)+'"><span class="u">'+esc(r.unit==='pc'?'pc':unitLabel(r.unit))+'</span></span>';
      return '<div class="srow">'+icoHTML(r.name)+'<div class="nm"><b>'+esc(cap(r.name))+'</b>'+(r.exp?'<span class="small muted">'+esc(expText(r.exp))+'</span>':'')+'</div>'+right+'</div>';
    }).join('')+'</div>'+(left?'<div class="small muted">'+left+' article'+(left>1?'s':'')+' non coché'+(left>1?'s':'')+' : '+(left>1?'ils restent':'il reste')+' dans ta liste.</div>':'')+
      '<button class="btn primary block" data-a="validok">Mettre mon stock à jour</button><button class="btn ghost" data-a="validcancel">Continuer mes courses</button></div>';
  } else if(vr.length){
    h+='<button class="btn primary block" data-a="validask">Valider mes courses ('+vr.length+' article'+(vr.length>1?'s':'')+')</button>';
  }
  h+='<form class="card" id="xform" style="display:flex;flex-direction:column;gap:8px"><label class="f" for="xname">Ajouter autre chose (lessive, fruits du goûter…)</label><div class="row"><input class="inp" id="xname" placeholder="Ex. : bananes" autocomplete="off"><button class="btn primary" type="submit">Ajouter</button></div></form>';
  return h;
}

function srowHTML(st){
  var low=isLow(st), q=num(st.qty), open=!!view.sopen[st.key];
  var status='';
  if(st.type==='basique') status='';
  else if(q<=0) status='<span class="pill plain">épuisé</span>';
  else if(low) status='<span class="pill warn">bientôt épuisé</span>';
  var right = st.type==='basique'
    ? '<button class="lvl lvl-'+(st.have?'ok':'out')+'" data-a="havecycle" data-x="'+esc(st.key)+'" aria-label="'+esc(cap(st.name))+' : '+(st.have?'j’en ai':'fini')+'. Toucher pour changer">'+(st.have?'J’en ai':'Fini')+'</button>'
    : q<=0 ? '<button class="lvl lvl-out" data-a="prodopen" data-x="'+esc(st.key)+'" aria-label="'+esc(cap(st.name))+' : épuisé. Toucher pour modifier">Épuisé</button>'
    : '<span class="qtyedit"><input type="text" inputmode="decimal" data-f="sqty" data-i="'+esc(st.key)+'" value="'+esc(String(Math.round(q*100)/100).replace('.',','))+'" aria-label="Quantité de '+esc(st.name)+'"><span class="u">'+esc(st.unit==='pc'?'pc':unitLabel(st.unit))+'</span></span>';
  var h='<div class="srow">'+icoHTML(st.name)+'<div class="nm"><b>'+esc(cap(st.name))+'</b><span class="small">'+(st.exp && q>0 ? esc(expText(st.exp)) : (st.type==='frais'?'acheté '+agoText(st.bought||st.at):'vérifié '+agoText(st.at)))+'</span> '+status+(q>0?expPill(st.exp):'')+'<div><button class="linkbtn" data-a="sopen" data-x="'+esc(st.key)+'">'+(open?'fermer':'options')+'</button></div>';
  if(open){
    var thr=threshold(st);
    h+='<div class="sopts"><select data-f="stype" data-i="'+esc(st.key)+'" aria-label="Type">'+TYPES.map(function(t){return '<option value="'+t[0]+'"'+(t[0]===st.type?' selected':'')+'>'+t[1]+'</option>';}).join('')+'</select>'+
      (st.type!=='basique'?'<label class="small muted">Alerte « bientôt épuisé » sous <input type="text" inputmode="decimal" data-f="slow" data-i="'+esc(st.key)+'" value="'+esc(st.low!=null&&st.low!==''?st.low:'')+'" placeholder="'+esc(thr?fmtNum(thr):'—')+'" style="width:60px;border:2px solid var(--line);border-radius:10px;padding:3px 6px;font-weight:800"> '+esc(st.unit==='pc'?'pc':unitLabel(st.unit))+(st.low!=null&&st.low!==''?'':' <span>(auto)</span>')+'</label>':'')+
      (st.type!=='basique'?'<label class="small muted">Péremption <input type="date" data-f="sexp" data-i="'+esc(st.key)+'" value="'+esc(st.exp||'')+'" style="border:2px solid var(--line);border-radius:10px;padding:2px 6px;font-weight:800;background:var(--surface)"></label>'+
       '<label class="small muted"><input type="checkbox" data-f="saskexp" data-i="'+esc(st.key)+'"'+((st.askExp!=null?st.askExp:(st.type==='frais'||EXP_AISLES.indexOf(st.aisle)>=0))?' checked':'')+'> Demander la date à l’achat</label>':'')+
      '<button class="linkbtn" data-a="sdel" data-x="'+esc(st.key)+'" style="color:#E23D5B">supprimer</button></div>';
  }
  return h+'</div>'+right+'</div>';
}
function levelLabel(l){ for(var i=0;i<LEVELS.length;i++) if(LEVELS[i][0]===l) return LEVELS[i][1]; return LEVELS[0][1]; }
function levelPill(st){
  var l=st.level||'ok';
  return '<button class="lvl lvl-'+l+'" data-a="levelcycle" data-x="'+esc(st.key)+'" aria-label="'+esc(cap(st.name))+' : '+esc(levelLabel(l))+'. Toucher pour changer">'+esc(levelLabel(l))+'</button>';
}
function mrowHTML(st){
  var open=!!view.sopen[st.key];
  var h='<div class="srow">'+icoHTML(st.name)+'<div class="nm"><b>'+esc(cap(st.name))+'</b><span class="small muted">vérifié '+agoText(st.at)+'</span><div><button class="linkbtn" data-a="sopen" data-x="'+esc(st.key)+'">'+(open?'fermer':'options')+'</button></div>';
  if(open) h+='<div class="sopts"><label class="small muted">Me demander tous les <select data-f="mevery" data-i="'+esc(st.key)+'" aria-label="Fréquence de vérification">'+EVERY_OPTS.map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===maisonEvery(st)?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></label><select data-f="mcat" data-i="'+esc(st.key)+'" aria-label="Catégorie">'+MAISON_AISLES.map(function(c){return '<option'+(c===st.aisle?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select><button class="linkbtn" data-a="sdel" data-x="'+esc(st.key)+'" style="color:#E23D5B">supprimer</button></div>';
  return h+'</div>'+levelPill(st)+'</div>';
}
function vMaison(){
  var all=vals(S.stock).filter(function(st){return st.type==='maison';}), have={};
  all.forEach(function(st){ have[st.nk]=1; });
  var h='';
  if(!all.length) h+='<div class="card empty">'+motifSVG('coeur')+'Ton inventaire maison est vide.<br>Touche les produits que tu as chez toi pour les ajouter.</div>';
  MAISON_AISLES.forEach(function(c){
    var its=all.filter(function(st){return (st.aisle||'Entretien')===c;}).sort(function(a,b){ return a.name.localeCompare(b.name,'fr'); });
    var sugg=(MAISON_SUGG[c]||[]).filter(function(s){ return !have[norm(s)]; });
    var lowN=its.filter(function(st){return st.level&&st.level!=='ok';}).length;
    h+='<section class="card sgroup"><h2>'+esc(c)+(lowN?' <span class="pill warn">'+lowN+' à racheter</span>':'')+'</h2><div class="small muted" style="margin-bottom:6px">'+esc(MAISON_HELP[c])+'</div>'+its.map(mrowHTML).join('');
    if(sugg.length) h+='<div class="small muted" style="margin-top:10px">Touche pour ajouter :</div><div class="chips" style="flex-wrap:wrap">'+sugg.map(function(s){ return '<button class="chip" data-a="madd" data-x="'+esc(s)+'" data-y="'+esc(c)+'">+ '+esc(s)+'</button>'; }).join('')+'</div>';
    h+='</section>';
  });
  h+='<form class="card stack" id="mform"><h3>Autre produit</h3><input class="inp" id="m-name" placeholder="Ex. : liquide lave-glace, piles AA" autocomplete="off" aria-label="Produit"><select class="inp" id="m-cat" aria-label="Catégorie"><option value="">Catégorie : auto</option>'+MAISON_AISLES.map(function(c){return '<option>'+esc(c)+'</option>';}).join('')+'</select><button class="btn primary" type="submit">Ajouter</button></form>';
  return h;
}
/* Vue grille : un carré par produit présent, rangés par famille */
var GRID_FAMILIES = [['Fruits & légumes','Fruits & légumes'],['Frais & crèmerie','Crèmerie'],['Tofu & protéines','Tofu & protéines'],['Féculents & céréales','Féculents'],['Conserves & bocaux','Conserves'],['Épicerie','Épicerie'],['Surgelés','Surgelés'],['Boulangerie','Boulangerie'],['Placard (huile, épices, sauces)','Placard'],['Autre','Autre']];
function gridState(st){
  if(st.type==='maison') return st.level==='out' ? null : (st.level==='low' ? 'low' : 'ok');
  if(st.type==='basique') return st.have ? 'ok' : null;
  if(num(st.qty)<=0) return null;
  var du=daysUntil(st.exp);
  return (isLow(st) || (du!=null && du<=2)) ? 'low' : 'ok';
}
function tileHTML(st, s){
  var tip = s==='low' ? (st.type==='maison' ? 'bientôt fini' : 'bientôt épuisé') : 'en stock';
  return '<button class="stile" data-a="prodopen" data-x="'+esc(st.key)+'" aria-label="'+esc(cap(st.name))+' : '+tip+'. Ouvrir la fiche"><span class="dot '+s+'"></span>'+icoHTML(st.name)+'<b>'+esc(cap(st.name))+'</b></button>';
}
function gridSection(title, items){
  var shown=items.map(function(st){ return [st,gridState(st)]; }).filter(function(x){ return x[1]; }).sort(function(x,y){ return x[0].name.localeCompare(y[0].name,'fr'); });
  if(!shown.length) return '';
  return '<section class="gsec"><h3>'+esc(title)+' <span class="muted small">'+shown.length+'</span></h3><div class="sgrid">'+shown.map(function(x){ return tileHTML(x[0],x[1]); }).join('')+'</div></section>';
}
function optsHTML(st){
  var k=esc(st.key), h='<div class="stack popts">';
  if(st.type==='maison'){
    h+='<label class="f">Me demander tous les<select class="inp" data-f="mevery" data-i="'+k+'">'+EVERY_OPTS.map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===maisonEvery(st)?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></label>';
    h+='<label class="f">Catégorie<select class="inp" data-f="mcat" data-i="'+k+'">'+MAISON_AISLES.map(function(c){return '<option'+(c===st.aisle?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select></label>';
  } else {
    h+='<label class="f">Rayon<select class="inp" data-f="scat" data-i="'+k+'">'+AISLES.filter(function(x){return !isMaisonAisle(x);}).map(function(x){return '<option'+(x===(st.aisle||guessAisle(st.name))?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select></label>';
    h+='<label class="f">Type de produit<select class="inp" data-f="stype" data-i="'+k+'">'+TYPES.map(function(t){return '<option value="'+t[0]+'"'+(t[0]===st.type?' selected':'')+'>'+t[1]+'</option>';}).join('')+'</select></label>';
    if(st.type!=='basique'){
      var thr=threshold(st);
      h+='<label class="f">Alerte « bientôt épuisé » sous ('+esc(st.unit==='pc'?'pièces':unitLabel(st.unit))+')<input class="inp" type="text" inputmode="decimal" data-f="slow" data-i="'+k+'" value="'+esc(st.low!=null&&st.low!==''?st.low:'')+'" placeholder="'+esc(thr?'auto : '+fmtNum(thr):'—')+'"></label>';
      h+='<label class="row small muted" style="gap:8px"><input type="checkbox" data-f="saskexp" data-i="'+k+'"'+((st.askExp!=null?st.askExp:(st.type==='frais'||EXP_AISLES.indexOf(st.aisle)>=0))?' checked':'')+'> Demander la date de péremption à l’achat</label>';
    }
  }
  h+='<button class="btn sm danger" data-a="sdel" data-x="'+k+'" style="align-self:flex-start">Supprimer ce produit</button></div>';
  return h;
}
function prodModal(){
  var st=view.prodFor && S.stock[view.prodFor]; if(!st) return '';
  var k=esc(st.key), q=num(st.qty), body='';
  if(st.type==='maison'){
    body='<div class="row between"><span class="muted small">État · touche pour changer</span>'+levelPill(st)+'</div>';
  } else if(st.type==='basique'){
    body='<div class="row between"><span class="muted small">État · touche pour changer</span><button class="lvl lvl-'+(st.have?'ok':'out')+'" data-a="havecycle" data-x="'+k+'">'+(st.have?'J’en ai':'Fini')+'</button></div>';
  } else {
    var step = st.unit==='pc' ? 1 : (st.unit==='g'||st.unit==='ml') ? 50 : 1;
    body='<div class="stack"><div class="row between"><span class="muted small">Quantité</span>'+(q<=0?'<span class="lvl lvl-out" style="cursor:default">Épuisé</span>':'')+'</div><div class="qbig"><button class="icon-btn" data-a="pqty" data-x="'+k+'" data-y="-'+step+'" aria-label="Moins">−</button><input type="text" inputmode="decimal" data-f="sqty" data-i="'+k+'" value="'+esc(String(Math.round(q*100)/100).replace('.',','))+'" aria-label="Quantité"><span class="u">'+esc(st.unit==='pc'?'pièce(s)':unitLabel(st.unit))+'</span><button class="icon-btn" data-a="pqty" data-x="'+k+'" data-y="'+step+'" aria-label="Plus">+</button></div></div>';
    body+='<label class="f">Date de péremption<input class="inp" type="date" data-f="sexp" data-i="'+k+'" value="'+esc(st.exp||'')+'"></label>';
    var info=[]; if(q>0 && isLow(st)) info.push('bientôt épuisé'); if(st.exp && q>0) info.push(expText(st.exp));
    if(info.length) body+='<div class="small muted">'+esc(info.join(' · '))+'</div>';
  }
  var inList=!!lowExtra(st.key);
  var open=!!view.sopen[st.key];
  return '<div class="modal-bg"><div class="card modal stack" role="dialog" aria-modal="true" aria-labelledby="prod-title">'+
    '<div class="row between"><div class="row">'+icoHTML(st.name)+'<div><h2 id="prod-title">'+esc(cap(st.name))+'</h2><div class="small muted">vérifié '+esc(agoText(st.at))+'</div></div></div><button class="icon-btn" data-a="prodclose" aria-label="Fermer">×</button></div>'+
    body+
    '<button class="linkbtn" data-a="sopen" data-x="'+k+'" style="align-self:flex-start">'+(open?'Masquer les options':'Options')+'</button>'+(open?optsHTML(st):'')+
    '<div class="row" style="justify-content:flex-end"><button class="btn '+(inList?'mint':'primary')+'" data-a="lowadd" data-x="'+k+'">'+(inList?'✓ Dans la liste':'+ Ajouter à la liste')+'</button></div>'+
    '</div></div>';
}
function vGrid(tab){
  var h='', all=vals(S.stock);
  if(tab==='maison'){
    var m=all.filter(function(st){return st.type==='maison';});
    MAISON_AISLES.forEach(function(c){ h+=gridSection(c, m.filter(function(st){ return (st.aisle||'Entretien')===c; })); });
  } else {
    var k=all.filter(function(st){return st.type!=='maison';}), done={};
    GRID_FAMILIES.forEach(function(f){
      var its=k.filter(function(st){ var ai=st.aisle||guessAisle(st.name); if(GRID_FAMILIES.every(function(g){return g[0]!==ai;})) ai='Autre'; if(ai===f[0]){ done[st.key]=1; return true; } return false; });
      h+=gridSection(f[1], its);
    });
  }
  if(!h) h='<div class="card empty">'+motifSVG('pates')+'Rien en stock pour l’instant.</div>';
  return '<div class="small muted"><span class="dot ok inl"></span> en stock · <span class="dot low inl"></span> bientôt fini · les produits finis sont masqués</div>'+h;
}
function vStock(){
  var tab=view.stab||'cuisine';
  var all=vals(S.stock).filter(function(st){return st.type!=='maison';});
  var sv=(S.settings && S.settings.stockView)||'list';
  var h='<div class="row between"><h1>Mon stock</h1><span class="vswitch" role="group" aria-label="Affichage"><button class="'+(sv==='list'?'on':'')+'" data-a="stview" data-x="list" aria-pressed="'+(sv==='list')+'" aria-label="Vue liste"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.2" fill="currentColor"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/></svg></button><button class="'+(sv==='grid'?'on':'')+'" data-a="stview" data-x="grid" aria-pressed="'+(sv==='grid')+'" aria-label="Vue grille"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg></button></span></div><div class="seg" role="tablist"><button role="tab" class="'+(tab==='cuisine'?'on':'')+'" aria-selected="'+(tab==='cuisine')+'" data-a="stab" data-x="cuisine">Cuisine</button><button role="tab" class="'+(tab==='maison'?'on':'')+'" aria-selected="'+(tab==='maison')+'" data-a="stab" data-x="maison">Maison</button></div>';
  if(sv==='grid') return h+vGrid(tab);
  if(tab==='maison') return h+'<div class="small muted">Touche l’étiquette d’un produit pour changer son état. « Bientôt fini » et « Fini » l’ajoutent à ta liste de courses.</div>'+vMaison();
  h+='<div class="small muted">Il se remplit quand tu valides tes courses et se vide quand tu cuisines.</div>';
  if(!all.length) h+='<div class="card empty">'+motifSVG('pates')+'Ton stock est vide pour l’instant.<br>Valide tes courses : les produits arriveront ici tout seuls.<a class="btn primary" href="#courses">Aller aux courses</a></div>';
  [['compte','Comptés','#FFB872'],['basique','Basiques','#C9A27E'],['frais','Frais','#7BD389']].forEach(function(g){
    var its=all.filter(function(st){return st.type===g[0];}).sort(function(a,b){ return a.name.localeCompare(b.name,'fr'); });
    if(!its.length) return;
    var lowN=its.filter(isLow).length;
    h+='<section class="card sgroup"><h2>'+esc(g[1])+(lowN?' <span class="pill warn">'+lowN+' bientôt épuisé'+(lowN>1?'s':'')+'</span>':'')+'</h2><div class="small muted" style="margin-bottom:6px">'+esc(TYPE_HELP[g[0]])+'</div>'+its.map(srowHTML).join('')+'</section>';
  });
  h+='<form class="card stack" id="sform"><h3>Ajouter au stock</h3><div class="small muted">Pour ce que tu as déjà dans tes placards.</div><input class="inp" id="s-name" placeholder="Ex. : riz, huile d’olive, œufs" autocomplete="off" aria-label="Produit">'+
    '<div class="grid3"><input class="inp" id="s-qty" inputmode="decimal" placeholder="Quantité" aria-label="Quantité"><select class="inp" id="s-unit" aria-label="Unité"><option value="g">g</option><option value="ml">ml</option><option value="pc">pièce(s)</option></select></div>'+
    '<select class="inp" id="s-type" aria-label="Type"><option value="">Type : auto</option>'+TYPES.map(function(t){return '<option value="'+t[0]+'">'+t[1]+'</option>';}).join('')+'</select><button class="btn primary" type="submit">Ajouter</button></form>';
  return h;
}

function swRow(list, key, cur){
  var known=list.some(function(c){ return c.toUpperCase()===String(cur).toUpperCase(); });
  return '<div class="swatches">'+list.map(function(c){ var on=c.toUpperCase()===String(cur).toUpperCase(); return '<button class="sw'+(on?' on':'')+'" style="background:'+c+'" data-a="lookset" data-x="'+key+'" data-y="'+c+'" aria-label="'+c+'" aria-pressed="'+on+'"></button>'; }).join('')+
    '<label class="sw swpick'+(known?'':' on')+'" style="background:'+(known?'conic-gradient(#ff5c8a,#ffc94a,#6ee7a8,#5fd3f3,#8a63f2,#ff5c8a)':esc(cur))+'" title="Autre couleur"><input type="color" data-f="lookpick" data-i="'+key+'" value="'+esc(String(cur).toLowerCase())+'" aria-label="Choisir une autre couleur"></label></div>';
}
function segLook(key, opts, cur){
  return '<div class="seg seg'+opts.length+'" role="group">'+opts.map(function(o){ var on=o[0]===cur; return '<button class="'+(on?'on':'')+'" data-a="lookset" data-x="'+key+'" data-y="'+o[0]+'" aria-pressed="'+on+'">'+o[1]+'</button>'; }).join('')+'</div>';
}
function lookEditor(){
  var L=curLook();
  var h='<div class="card stack"><h2>Mon ambiance</h2>';
  h+='<div class="small muted">Thèmes tout prêts (tu peux ensuite tout ajuster en dessous) :</div><div class="pal">'+LOOK_PRESETS.map(function(p){
    var on=L.preset===p[0], v=p[2];
    return '<button class="palb'+(on?' on':'')+'" data-a="lookpreset" data-x="'+p[0]+'" aria-pressed="'+on+'"><span class="dots"><i style="background:'+v.bg+';box-shadow:0 0 0 1px rgba(0,0,0,.15)"></i><i style="background:'+v.accent+'"></i><i style="background:'+v.second+'"></i></span>'+p[1]+'</button>';
  }).join('')+'</div>';
  h+='<h3 style="margin-top:8px">Personnaliser</h3>';
  h+='<div class="stack"><span class="small muted">Style</span>'+segLook('style',[['kawaii','Kawaii'],['pixel','Pixel']],L.style)+'</div>';
  h+='<div class="stack"><span class="small muted">Motif du fond</span>'+segLook('pattern',[['dots','Points'],['grid','Quadrillage'],['plain','Uni']],L.pattern)+'</div>';
  h+='<div class="stack"><span class="small muted">Couleur du fond</span>'+swRow(SW_BG,'bg',L.bg)+'</div>';
  h+='<div class="stack"><span class="small muted">Couleur principale (boutons, titres, sélection)</span>'+swRow(SW_ACCENT,'accent',L.accent)+'</div>';
  h+='<div class="stack"><span class="small muted">Couleur secondaire (« en stock », « réalisable », « j’en ai »)</span>'+swRow(SW_SECOND,'second',L.second)+'</div>';
  h+='<div class="row wrapflex" style="gap:6px"><span class="btn primary sm">Bouton</span><span class="chip on">Filtre</span><span class="pill mint">✓ Réalisable</span><span class="pill time">'+CLOCK+'20 min</span></div>';
  return h+'</div>';
}
function expModal(){
  var k=view.expFor; if(!k || !checks[k]) return '';
  var it=null, name='', unit='pc', def=1;
  if(k.indexOf('x:')===0){ S.plan.extras.forEach(function(x){ if('x:'+x.id===k){ var st=S.stock[x.skey]; name=x.name; if(st){ unit=st.unit; var pk=packMap()[x.skey]; def=num(st.lastBuy)||(pk?num(pk.size):0)||threshold(st)||1; } } }); }
  else { it=findShopItem(k); if(!it) return ''; name=it.name; unit=it.unit; def=buyAmount(it); }
  var ci=chkInfo(k), q=ci.qty||def;
  return '<div class="modal-bg"><div class="card modal stack" role="dialog" aria-modal="true" aria-labelledby="exp-title">'+
    '<div class="row between"><div class="row">'+icoHTML(name)+'<h2 id="exp-title">'+esc(cap(name))+'</h2></div><button class="icon-btn" data-a="expskip" aria-label="Fermer">×</button></div>'+
    '<label class="f" for="exp-date">Date de péremption<input class="inp" type="date" id="exp-date" value="'+esc(ci.exp||'')+'" min="'+todayISO(-30)+'"></label>'+
    '<div class="chips" style="flex-wrap:wrap">'+[[3,'+3 j'],[7,'+1 sem'],[14,'+2 sem'],[30,'+1 mois']].map(function(d){ return '<button class="chip" data-a="expquick" data-x="'+d[0]+'">'+d[1]+'</button>'; }).join('')+'</div>'+
    '<label class="f" for="exp-qty">Quantité achetée<span class="qtyedit"><input type="text" inputmode="decimal" id="exp-qty" value="'+esc(String(Math.round(q*100)/100).replace('.',','))+'"><span class="u">'+esc(unit==='pc'?'pc':unitLabel(unit))+'</span></span></label>'+
    '<div class="row"><button class="btn primary" data-a="expsave" style="flex:1">Enregistrer</button><button class="btn ghost" data-a="expskip">Passer</button></div>'+
    '<div class="small muted">Tu peux couper ces questions dans Réglages → Courses.</div>'+
    '</div></div>';
}
function vSettings(){
  var h='<a class="back" href="#accueil">‹ Accueil</a><h1>Réglages</h1>';
  if(!isInstalled() && !inFrame()) h+='<div class="card stack install"><h2>Installer l’appli</h2>'+installSteps()+'</div>';
  h+=lookEditor();
  h+='<h2 style="margin-top:6px">Courses</h2><div class="card stack"><label class="row between" style="gap:12px"><span><b>Demander la date de péremption</b><br><span class="small muted">Quand je coche un produit frais, une petite fenêtre propose la date et la quantité.</span></span><input type="checkbox" class="switch" data-f="setexp"'+(S.settings && S.settings.expAsk!==false?' checked':'')+'></label></div>';
  h+='<h2 style="margin-top:6px">Sauvegarde</h2><div class="card stack"><span class="small muted">Tout est enregistré sur ce téléphone. Télécharge une sauvegarde de temps en temps : elle te permet de tout récupérer sur un nouveau téléphone, ou d’envoyer tes recettes à quelqu’un.</span><button class="btn primary" data-a="backup">Sauvegarder (fichier)</button>'+
    '<button class="btn" data-a="backuptext">Copier la sauvegarde (texte)</button>'+
    '<label class="btn filebtn">Restaurer une sauvegarde<input type="file" accept=".json,application/json,text/plain" id="restorefile"></label>';
  if(view.confirmRestore) h+='<div class="banner stack"><span>Cette sauvegarde va <b>remplacer</b> tes recettes'+(view.confirmRestore.full?', ta semaine et ton stock':' et tes paquets')+' actuels ('+view.confirmRestore.n+' recette'+(view.confirmRestore.n>1?'s':'')+' dans le fichier).</span><span class="row"><button class="btn sm danger" data-a="restoreok">Oui, restaurer</button><button class="btn sm ghost" data-a="restorecancel">Annuler</button></span></div>';
  h+='<details><summary class="small muted" style="cursor:pointer">Restaurer une sauvegarde copiée (texte)</summary><div class="stack" style="margin-top:8px"><textarea class="inp" id="restore" style="min-height:70px" placeholder="Colle ici une sauvegarde copiée (v1 ou v2)"></textarea><button class="btn" data-a="restoretext">Restaurer ce texte</button></div></details></div>';
  h+='<h2 style="margin-top:12px">Tailles des paquets</h2><div class="small muted">C’est ce qui permet à l’appli de savoir combien de paquets acheter et ce qu’il en restera. « Frais » veut dire que le paquet s’abîme une fois ouvert : l’appli te prévient s’il risque d’en rester.</div>';
  h+='<div class="card">'+S.packs.map(function(p,ix){
    return '<div class="packbox"><div class="prow-pack"><input class="inp" aria-label="Produit" data-f="pack" data-i="'+ix+'" data-k="name" value="'+esc(p.name)+'" placeholder="Produit"><input class="inp" aria-label="Taille" data-f="pack" data-i="'+ix+'" data-k="size" inputmode="decimal" value="'+esc(p.size)+'"><select class="inp" aria-label="Unité" data-f="pack" data-i="'+ix+'" data-k="unit">'+['g','ml','pc'].map(function(u){return '<option value="'+u+'"'+(u===p.unit?' selected':'')+'>'+(u==='pc'?'pièces':u)+'</option>';}).join('')+'</select></div>'+
      '<div class="prow-pack2"><select class="inp" aria-label="Type de paquet" data-f="pack" data-i="'+ix+'" data-k="label" style="padding:7px 8px;font-size:14px">'+PACK_LABELS.map(function(l){return '<option'+(l===p.label?' selected':'')+'>'+l+'</option>';}).join('')+'</select><label class="tog"><input type="checkbox" data-f="pack" data-i="'+ix+'" data-k="frais"'+(p.frais?' checked':'')+'> Frais</label><button class="icon-btn" data-a="packdel" data-x="'+ix+'" aria-label="Supprimer">×</button></div></div>';
  }).join('')+'</div><button class="btn" data-a="packadd">+ Ajouter un produit</button>';
  h+='<div class="small muted" style="text-align:center;margin-top:10px">La cuisine d’Eva · v2.13</div>';
  return h;
}

var lastRoute=null;
function render(){
  applyLook();
  pidN=0;
  var r=route(), h;
  if(r.indexOf('recette-')===0) h=vDetail(r.slice(8));
  else if(r.indexOf('modifier-')===0) h=vEdit(r.slice(9));
  else if(r==='nouvelle') h=vEdit(null);
  else if(r==='semaine') h=vWeek();
  else if(r==='courses') h=vShop();
  else if(r==='stock') h=vStock();
  else if(r==='reglages') h=vSettings();
  else h=vHome();
  var tab = ['semaine','courses','stock','nouvelle'].indexOf(r)>=0 ? r : r==='reglages' ? '' : 'accueil';
  var y=window.scrollY;
  root.innerHTML=header()+'<main class="wrap">'+h+'</main>'+nav(tab)+(toastMsg?'<div class="toast" role="status">'+esc(toastMsg)+'</div>':'')+(r==='courses'?expModal():'')+(r==='stock'?prodModal():'');
  document.body.classList.toggle('modal-open', !!((r==='courses'&&view.expFor)||(r==='stock'&&view.prodFor)));
  if(r!==lastRoute){ window.scrollTo(0,0); lastRoute=r; } else window.scrollTo(0, ((view.expFor||view.prodFor) && view.keepY!=null) ? view.keepY : y);
}
var toastMsg='', toastT=null;
function toast(m){ toastMsg=m; render(); clearTimeout(toastT); toastT=setTimeout(function(){ toastMsg=''; var t=document.querySelector('.toast'); if(t) t.remove(); },2000); }

/* ---------- actions ---------- */
function addToPlan(rid, servings){
  var r=getRecipe(rid); if(!r) return;
  var p=planFor(rid);
  if(p) p.servings=servings||p.servings;
  else S.plan.items.push({id:uid('p'),recipeId:rid,servings:servings||num(r.servings)||2,day:0});
  save();
}
function copyToClipboard(text, okMsg){
  var done=function(){ view.copyText=''; toast(okMsg); };
  try{ navigator.clipboard.writeText(text).then(done, function(){ view.copyText=text; render(); }); }
  catch(e){ view.copyText=text; render(); }
}
function listText(){
  var m=shopModel(), out=['Courses de la semaine'];
  AISLES.forEach(function(a){
    var its=m.main.filter(function(it){return it.aisle===a && !checks[it.key];});
    var ex=S.plan.extras.filter(function(x){return (x.aisle||'Autre')===a && !checks['x:'+x.id];});
    if(!its.length && !ex.length) return;
    out.push('', a);
    its.forEach(function(it){ var t=buyText(it); out.push('- '+cap(it.name)+(t?' : '+t:'')); });
    ex.forEach(function(x){ out.push('- '+x.name); });
  });
  var pl=m.plac.filter(function(it){return !checks[it.key];});
  if(pl.length){ out.push('','À vérifier dans les placards'); pl.forEach(function(it){ out.push('- '+cap(it.name)); }); }
  return out.join('\n');
}
function findShopItem(key){
  var m=shopModel(), all=m.main.concat(m.plac);
  for(var i=0;i<all.length;i++) if(all[i].key===key) return all[i];
  return null;
}
function toggleCheck(key){
  if(checks[key]) delete checks[key]; else { checks[key]=1; if(wantsExp(key)){ view.expFor=key; view.keepY=window.scrollY; } }
  saveChecks(); render();
}
function chkInfo(k){ var c=checks[k]; return (c && typeof c==='object') ? c : {}; }
/* Récapitulatif avant validation : ce qui a été coché, avec la quantité qui ira dans le stock */
function validationRows(){
  var m=shopModel(), rows=[];
  m.main.concat(m.plac).forEach(function(it){
    if(!checks[it.key]) return;
    var def = (it.type==='basique'||it.type==='maison') ? null : buyAmount(it);
    var ci=chkInfo(it.key); if(def!=null && ci.qty) def=ci.qty;
    rows.push({k:it.key, name:it.name, unit:it.unit, type:it.type, aisle:it.aisle, def:def, exp:ci.exp||null});
  });
  S.plan.extras.forEach(function(x){
    var k='x:'+x.id; if(!checks[k]) return;
    var st=x.skey?S.stock[x.skey]:null, def=null;
    if(st && st.type!=='basique'){ var pk=packMap()[x.skey]; def=num(st.lastBuy)||(pk?num(pk.size):0)||threshold(st)||1; }
    var cx=chkInfo(k); if(def!=null && cx.qty) def=cx.qty;
    rows.push({k:k, name:x.name, unit:st?st.unit:'', type:st?st.type:(isMaisonAisle(x.aisle)?'maison':''), extra:x, st:st, def:def, exp:cx.exp||null});
  });
  return rows;
}
/* garde la date la plus proche s'il reste déjà du produit */
function setExp(st, exp){ if(!exp) return; if(num(st.qty)>0 && st.exp && daysUntil(st.exp)>=0 && st.exp<exp) return; st.exp=exp; }
function validateShopping(){
  var rows=validationRows(), n=0;
  rows.forEach(function(r){
    var q = r.def==null ? null : (view.vq[r.k]!=null && String(view.vq[r.k]).trim()!=='' ? num(view.vq[r.k]) : r.def);
    if(r.extra){
      if(!r.st && r.type==='maison'){ var em=ensureStock(r.name,'*','maison',r.extra.aisle); em.st.level='ok'; em.st.at=now(); n++; }
      if(r.st){
        if(r.st.type==='maison') r.st.level='ok';
        else if(r.st.type==='basique') r.st.have=true; else { setExp(r.st,r.exp); r.st.qty=num(r.st.qty)+q; r.st.lastBuy=q; r.st.bought=now(); }
        r.st.at=now(); n++;
      }
      S.plan.extras=S.plan.extras.filter(function(e){ return e!==r.extra; });
      return;
    }
    var e=ensureStock(r.name, (r.type==='basique'||r.type==='maison')?'*':r.unit, r.type, r.aisle);
    if(r.type==='maison') e.st.level='ok';
    else if(r.type==='basique') e.st.have=true;
    else { setExp(e.st,r.exp); e.st.qty=num(e.st.qty)+q; e.st.lastBuy=q; e.st.bought=now(); }
    e.st.at=now(); n++;
  });
  checks={}; view.vq={}; view.validate=false;
  saveChecks(); save();
  return n;
}
function readBackup(text){
  var o=null; try{ o=JSON.parse(text); }catch(e){}
  if(!o) return null;
  if(o.state && Array.isArray(o.state.recipes)) return {full:true, state:o.state, n:o.state.recipes.length};
  if(Array.isArray(o.recipes) && o.plan) return {full:true, state:o, n:o.recipes.length};
  if(Array.isArray(o.recipes)) return {full:false, recipes:o.recipes, packs:o.packs, n:o.recipes.length};
  return null;
}
function applyBackup(b){
  if(b.full){ S=migrate(clone(b.state)); checks={}; saveChecks(); }
  else { S.recipes=b.recipes; if(Array.isArray(b.packs)) S.packs=b.packs; }
  save();
}
function downloadBackup(){
  var d=new Date(), stamp=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  var name='cuisine-eva-'+stamp+'.json';
  var data=JSON.stringify({app:'cuisine-eva', v:2, savedAt:now(), state:S});
  var blob=new Blob([data],{type:'application/json'});
  try{
    var file=new File([blob],name,{type:'application/json'});
    if(navigator.maxTouchPoints>0 && navigator.canShare && navigator.canShare({files:[file]})){ navigator.share({files:[file], title:'Sauvegarde La cuisine d’Eva'}).catch(function(){}); return; }
  }catch(e){}
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1500);
  toast('Sauvegarde téléchargée');
}
function draftCover(){ var d=view.draft; if(!d.cover || typeof d.cover!=='object') d.cover={}; return d.cover; }
function answer(key, val){ var st=S.stock[key]; if(!st) return; if(val!=null) st.qty=Math.max(0,val); st.at=now(); save(); render(); }
function restoreY(){ var y=view.keepY; if(y==null) return; window.scrollTo(0,y); setTimeout(function(){ window.scrollTo(0,y); },60); setTimeout(function(){ window.scrollTo(0,y); },250); }
var ACT={
  open:function(x){ location.hash='recette-'+x; },
  fav:function(x){ if(S.favs[x]) delete S.favs[x]; else S.favs[x]=1; save(); render(); },
  filter:function(x){ view.filter=x; view.tag=''; render(); },
  tag:function(x){ view.tag = view.tag===x?'':x; render(); },
  toggleplan:function(x){ var p=planFor(x); if(p){ if(p.cooked) uncookPlan(p); S.plan.items=S.plan.items.filter(function(i){return i!==p;}); save(); render(); } else { addToPlan(x); toast('Ajoutée à ta semaine ♡'); } },
  serv:function(x,y){ var r=getRecipe(x), p=planFor(x); var cur=view.serv[x] || (p?num(p.servings):num(r.servings)) || 1; view.serv[x]=Math.max(1,cur+num(y)); render(); },
  addplan:function(x){ var r=getRecipe(x); var p=planFor(x); addToPlan(x, view.serv[x] || (p?num(p.servings):num(r.servings))); toast('Ta semaine est à jour ♡'); },
  delask:function(x){ view.confirmDel=x; render(); },
  delcancel:function(){ view.confirmDel=null; render(); },
  del:function(x){ S.recipes=S.recipes.filter(function(r){return r.id!==x;}); S.plan.items=S.plan.items.filter(function(p){return p.recipeId!==x;}); delete S.favs[x]; view.confirmDel=null; save(); location.hash='accueil'; },
  canceledit:function(){ lsDel(LS_DRAFT); view.draftFor=null; view.draft=null; },
  pastetoggle:function(){ view.pasteOpen=!view.pasteOpen; render(); },
  pasteapply:function(){
    var t=document.getElementById('paste'); if(!t) return;
    var lines=t.value.split(/\n/).map(parseLine).filter(Boolean);
    if(!lines.length) return;
    var d=view.draft; d.ingredients=d.ingredients.filter(function(i){return String(i.name||'').trim();}).concat(lines);
    view.pasteOpen=false; storeDraft(); render();
  },
  ingadd:function(){ view.draft.ingredients.push({qty:'',unit:'g',name:'',aisle:'',type:''}); storeDraft(); render(); },
  ingdel:function(x){ view.draft.ingredients.splice(+x,1); storeDraft(); render(); },
  motif:function(x){
    var c=draftCover(), cur=coverOf(view.draft);
    var sel=(c.motifs&&c.motifs.length)?c.motifs.slice():[];
    var i=sel.indexOf(x);
    if(i>=0) sel.splice(i,1); else { sel.push(x); if(sel.length>2) sel.shift(); }
    c.motifs=sel; c.photo=null;
    if(!c.bg) c.bg = sel.length ? MOTIFS[sel[0]].bg : cur.bg;
    if(!sel.length) delete c.motifs;
    storeDraft(); render();
  },
  coverbg:function(x){ var c=draftCover(); if(!(c.motifs&&c.motifs.length)){ c.motifs=coverOf(view.draft).motifs; } c.bg=x; storeDraft(); render(); },
  coverauto:function(){ view.draft.cover=null; storeDraft(); render(); },
  coverphotodel:function(){ var c=draftCover(); c.photo=null; storeDraft(); render(); },
  saverecipe:function(){
    var d=view.draft;
    if(!String(d.name||'').trim()){ view.err='Donne un nom à ta recette.'; render(); return; }
    var named=d.ingredients.filter(function(i){return String(i.name||'').trim();});
    named.forEach(function(i){ if(i.type) setType(norm(i.name), i.type); });
    var ings=named.map(function(i){ return {qty:num(i.qty)||(String(i.qty).trim()?0:1), unit:i.unit||'pc', name:String(i.name).trim(), aisle:i.aisle||''}; });
    var steps=(Array.isArray(d.steps)?d.steps:String(d.steps||'').split('\n')).map(function(s){return String(s).trim();}).filter(Boolean);
    var cv=d.cover && (d.cover.photo || (d.cover.motifs&&d.cover.motifs.length) || d.cover.bg) ? {photo:d.cover.photo||null, motifs:d.cover.motifs||null, bg:d.cover.bg||null} : null;
    var rec={id:d.id||uid('r'), name:String(d.name).trim(), time:Math.round(num(d.time))||0, servings:Math.max(1,Math.round(num(d.servings))||2), link:String(d.link||'').trim(), tags:(Array.isArray(d.tags)?d.tags:String(d.tags||'').split(',')).map(function(t){return String(t).trim();}).filter(Boolean), ingredients:ings, steps:steps, notes:d.notes||'', cover:cv};
    var old=getRecipe(rec.id);
    if(old){ rec.example=false; S.recipes[S.recipes.indexOf(old)]=rec; } else S.recipes.unshift(rec);
    lsDel(LS_DRAFT); view.draftFor=null; view.draft=null; view.serv={};
    save(); location.hash='recette-'+rec.id;
  },
  pserv:function(x,y){ S.plan.items.forEach(function(p){ if(p.id===x) p.servings=Math.max(1,num(p.servings)+num(y)); }); save(); render(); },
  pdel:function(x){ S.plan.items=S.plan.items.filter(function(p){ if(p.id===x && p.cooked){ /* garde le stock tel quel */ } return p.id!==x;}); save(); render(); },
  cook:function(x){ S.plan.items.forEach(function(p){ if(p.id===x) cookPlan(p); }); save(); toast('Bon appétit ! Stock mis à jour'); },
  uncook:function(x){ S.plan.items.forEach(function(p){ if(p.id===x) uncookPlan(p); }); save(); render(); },
  newweekask:function(){ view.confirmWeek=true; render(); },
  newweekcancel:function(){ view.confirmWeek=false; render(); },
  newweek:function(){ S.plan={stamp:uid('s'),items:[],reduce:{},extras:[]}; checks={}; saveChecks(); view.confirmWeek=false; save(); render(); },
  check:function(x){ toggleCheck(x); },
  reduce:function(x){ S.plan.reduce[x]=1; save(); toast('C’est noté, un paquet de moins'); },
  unreduce:function(x){ delete S.plan.reduce[x]; save(); render(); },
  boost:function(x,y){ S.plan.items.forEach(function(p){ if(p.id===x) p.servings=num(p.servings)+num(y); }); save(); toast('Portions ajoutées'); },
  addrec:function(x){ addToPlan(x); toast('Recette ajoutée à ta semaine ♡'); },
  copy:function(){ copyToClipboard(listText(),'Liste copiée'); },
  copyclose:function(){ view.copyText=''; render(); },
  expopen:function(x){ view.keepY=window.scrollY; view.expFor=x; render(); },
  expquick:function(x){ var el=document.getElementById('exp-date'); if(el) el.value=todayISO(num(x)); },
  expsave:function(){ var k=view.expFor; if(k && checks[k]){ var d=document.getElementById('exp-date'), q=document.getElementById('exp-qty'); var o={}; if(d && d.value) o.exp=d.value; if(q && String(q.value).trim()!=='') o.qty=Math.max(0,num(q.value)); checks[k]=Object.keys(o).length?o:1; saveChecks(); } view.expFor=null; render(); restoreY(); },
  expskip:function(){ view.expFor=null; render(); restoreY(); },
  validask:function(){ view.validate=true; view.vq={}; render(); var el=document.getElementById('valid'); if(el) el.scrollIntoView({block:'start'}); },
  validcancel:function(){ view.validate=false; render(); },
  validok:function(){ var n=validateShopping(); toast(n+' produit'+(n>1?'s':'')+' ajouté'+(n>1?'s':'')+' au stock'); },
  xdel:function(x){ var k='x:'+x; delete checks[k]; saveChecks(); S.plan.extras=S.plan.extras.filter(function(e){return e.id!==x;}); save(); render(); },
  lowadd:function(x){ var e=lowExtra(x); if(e){ delete checks['x:'+e.id]; saveChecks(); S.plan.extras=S.plan.extras.filter(function(y){return y!==e;}); } else { var st=S.stock[x]; if(st) S.plan.extras.push({id:uid('x'),name:st.name,aisle:st.aisle||guessAisle(st.name),skey:x}); } save(); render(); },
  ansnum:function(x){ var el=document.getElementById('ans-'+x); var v=el?String(el.value).trim():''; if(!v){ if(el) el.focus(); return; } answer(x, num(v)); },
  ansnone:function(x){ answer(x, 0); },
  ansok:function(x){ answer(x, null); },
  stab:function(x){ view.stab=x; view.sopen={}; render(); },
  levelcycle:function(x){ var st=S.stock[x]; if(!st) return; st.level=LEVEL_NEXT[st.level||'ok']; st.at=now(); save(); render(); },
  level:function(x,y){ var st=S.stock[x]; if(!st) return; st.level=y; st.at=now(); save(); render(); },
  madd:function(x,y){ var e=ensureStock(x,'*','maison',y); e.st.level='ok'; e.st.at=now(); save(); toast(x+' ajouté'); },
  havecycle:function(x){ var st=S.stock[x]; if(!st) return; st.have=!st.have; st.at=now(); save(); render(); },
  aislepick:function(x){ view.aisleFor=x; render(); },
  prodopen:function(x){ view.keepY=window.scrollY; view.prodFor=x; render(); },
  prodclose:function(){ view.prodFor=null; render(); restoreY(); },
  pqty:function(x,y){ var st=S.stock[x]; if(!st) return; st.qty=Math.max(0,Math.round((num(st.qty)+num(y))*100)/100); st.at=now(); save(); render(); },
  stview:function(x){ S.settings=S.settings||{}; S.settings.stockView=x; save(); render(); },
  have:function(x,y){ var st=S.stock[x]; if(!st) return; st.have = y==='1'; st.at=now(); save(); render(); },
  sopen:function(x){ view.sopen[x]=!view.sopen[x]; render(); },
  sdel:function(x){ delete S.stock[x]; if(view.prodFor===x) view.prodFor=null; save(); render(); },
  theme:function(x){ S.look=presetLook(x); S.look.preset=x; S.theme=x; save(); render(); },
  lookpreset:function(x){ ACT.theme(x); },
  lookset:function(x,y){ var L=clone(curLook()); L[x]=y; delete L.preset; S.look=L; save(); render(); },
  setpack:function(x,y){ S.packs.unshift({name:x,size:'',unit:y==='ml'?'ml':'g',label:'paquet',frais:true}); save(); location.hash='reglages'; setTimeout(function(){ var el=document.querySelector('[data-f="pack"][data-i="0"][data-k="size"]'); if(el){ el.scrollIntoView({block:'center'}); el.focus(); } },80); },
  packadd:function(){ S.packs.push({name:'',size:'',unit:'g',label:'paquet',frais:true}); render(); var els=document.querySelectorAll('[data-f="pack"][data-k="name"]'); if(els.length) els[els.length-1].focus(); },
  packdel:function(x){ S.packs.splice(+x,1); save(); render(); },
  backup:function(){ downloadBackup(); },
  backuptext:function(){ copyToClipboard(JSON.stringify({app:'cuisine-eva', v:2, savedAt:now(), state:S}),'Sauvegarde copiée : colle-la dans tes notes'); },
  restoretext:function(){
    var t=document.getElementById('restore'); var b=readBackup(t?t.value:'');
    if(!b){ toast('Ce texte n’est pas une sauvegarde valide'); return; }
    view.confirmRestore=b; render();
  },
  restoreok:function(){ if(view.confirmRestore){ applyBackup(view.confirmRestore); view.confirmRestore=null; toast('Sauvegarde restaurée'); } },
  restorecancel:function(){ view.confirmRestore=null; render(); },
  install:function(){ if(!installEvt) return; installEvt.prompt(); installEvt.userChoice.then(function(c){ if(c && c.outcome==='accepted') lsSet(LS_INSTALL,'1'); installEvt=null; render(); }, function(){}); },
  installhide:function(){ lsSet(LS_INSTALL,'1'); render(); }
};

root.addEventListener('click',function(e){
  var el=e.target.closest('[data-a]'); if(!el || !root.contains(el)) return;
  var a=el.getAttribute('data-a');
  if(!ACT[a]) return;
  if(el.tagName==='BUTTON' || a==='open') e.preventDefault();
  if(a==='open' && e.target.closest('button')) return;
  e.stopPropagation();
  ACT[a](el.getAttribute('data-x'), el.getAttribute('data-y'));
});
root.addEventListener('keydown',function(e){
  if(e.key==='Escape' && view.expFor){ ACT.expskip(); return; }
  if(e.key==='Escape' && view.prodFor){ ACT.prodclose(); return; }
  if((e.key==='Enter'||e.key===' ') && e.target.matches && e.target.matches('.rcard')){ e.preventDefault(); ACT.open(e.target.getAttribute('data-x')); }
  if(e.key==='Enter' && e.target.id && e.target.id.indexOf('ans-')===0){ e.preventDefault(); ACT.ansnum(e.target.id.slice(4)); }
});
root.addEventListener('input',function(e){
  var t=e.target;
  if(t.id==='q'){ view.q=t.value; var l=document.getElementById('list'); if(l) l.innerHTML=listHTML(); return; }
  var f=t.getAttribute('data-f'); if(!f) return;
  if(view.draft && ['name','time','servings','link','tags','steps','notes'].indexOf(f)>=0){
    view.draft[f] = f==='tags' ? t.value.split(',') : f==='steps' ? t.value.split('\n') : t.value; storeDraft(); return;
  }
  if(f==='ing' && view.draft){ var i=+t.getAttribute('data-i'); if(view.draft.ingredients[i]){ view.draft.ingredients[i][t.getAttribute('data-k')]=t.value; storeDraft(); } return; }
  if(f==='vq'){ view.vq[t.getAttribute('data-i')]=t.value; return; }
  if(f==='lookpick'){ var L=clone(curLook()); L[t.getAttribute('data-i')]=t.value.toUpperCase(); delete L.preset; S.look=L; applyLook(); return; }
});
root.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='coverfile' && t.files && t.files[0] && view.draft){
    readPhoto(t.files[0], function(data){
      if(!data){ toast('Impossible de lire cette photo'); return; }
      var c=draftCover(); c.photo=data; storeDraft(); render();
    });
    return;
  }
  if(t.id==='restorefile' && t.files && t.files[0]){
    var rd=new FileReader();
    rd.onload=function(){ var b=readBackup(String(rd.result||'')); if(!b){ toast('Ce fichier n’est pas une sauvegarde valide'); return; } view.confirmRestore=b; render(); };
    rd.readAsText(t.files[0]); return;
  }
  var f=t.getAttribute('data-f'); if(!f) return;
  var key=t.getAttribute('data-i');
  if(f==='day'){ S.plan.items.forEach(function(p){ if(p.id===key) p.day=+t.value; }); save(); render(); return; }
  if(f==='ing' && view.draft){ var i=+key; if(view.draft.ingredients[i]){ view.draft.ingredients[i][t.getAttribute('data-k')]=t.value; storeDraft(); if(t.getAttribute('data-k')==='name'||t.getAttribute('data-k')==='aisle') render(); } return; }
  if(f==='pack'){
    var p=S.packs[+key]; if(!p) return; var k=t.getAttribute('data-k');
    p[k] = k==='frais' ? t.checked : k==='size' ? num(t.value) : t.value;
    save(); return;
  }
  if(f==='vq'){ view.vq[key]=t.value; return; }
  if(f==='added'){
    var chk=checks[key]; if(!chk) return;
    var st=S.stock[chk.skey||key]; var nv=Math.max(0,num(t.value));
    if(st) st.qty=Math.max(0,num(st.qty)+nv-num(chk.added)), st.lastBuy=nv;
    chk.added=nv; saveChecks(); save(); render(); return;
  }
  if(f==='sqty'){ var s1=S.stock[key]; if(s1){ s1.qty=Math.max(0,num(t.value)); s1.at=now(); save(); render(); } return; }
  if(f==='slow'){ var s2=S.stock[key]; if(s2){ s2.low = String(t.value).trim()==='' ? null : num(t.value); save(); render(); } return; }
  if(f==='lookpick'){ var L2=clone(curLook()); L2[key]=t.value.toUpperCase(); delete L2.preset; S.look=L2; save(); render(); return; }
  if(f==='setaisle'){ S.aisles=S.aisles||{}; S.aisles[key]=t.value; vals(S.stock).forEach(function(z){ if(z.nk===key && z.type!=='maison') z.aisle=t.value; }); view.aisleFor=null; save(); render(); return; }
  if(f==='scat'){ var s8=S.stock[key]; if(s8){ s8.aisle=t.value; S.aisles=S.aisles||{}; S.aisles[s8.nk]=t.value; save(); render(); } return; }
  if(f==='setexp'){ S.settings=S.settings||{}; S.settings.expAsk=!!t.checked; save(); render(); return; }
  if(f==='sexp'){ var s6=S.stock[key]; if(s6){ s6.exp=t.value||null; save(); render(); } return; }
  if(f==='saskexp'){ var s7=S.stock[key]; if(s7){ s7.askExp=!!t.checked; save(); render(); } return; }
  if(f==='mevery'){ var s5=S.stock[key]; if(s5){ s5.every=num(t.value); save(); render(); } return; }
  if(f==='mcat'){ var s4=S.stock[key]; if(s4){ s4.aisle=t.value; save(); render(); } return; }
  if(f==='stype'){ var s3=S.stock[key]; if(s3){ var wasOpen=view.prodFor===key, nk=s3.nk; view.sopen={}; setType(nk, t.value); if(wasOpen){ view.prodFor=null; vals(S.stock).forEach(function(z){ if(z.nk===nk && z.type===t.value) view.prodFor=z.key; }); if(view.prodFor) view.sopen[view.prodFor]=true; } save(); render(); } return; }
});
root.addEventListener('submit',function(e){
  if(e.target.id==='xform'){ e.preventDefault(); var i=document.getElementById('xname'); var v=(i.value||'').trim(); if(!v) return;
    S.plan.extras.push({id:uid('x'),name:v,aisle:guessAisle(v)}); save(); render(); var n=document.getElementById('xname'); if(n) n.focus(); }
  if(e.target.id==='mform'){ e.preventDefault();
    var mn=(document.getElementById('m-name').value||'').trim(); if(!mn) return;
    var mc=document.getElementById('m-cat').value || (isMaisonAisle(guessAisle(mn))?guessAisle(mn):'Entretien');
    var me=ensureStock(mn,'*','maison',mc); me.st.level='ok'; me.st.at=now(); save(); toast(cap(mn)+' ajouté');
    var mi=document.getElementById('m-name'); if(mi) mi.focus(); return;
  }
  if(e.target.id==='sform'){ e.preventDefault();
    var nm=(document.getElementById('s-name').value||'').trim(); if(!nm) return;
    var q=num(document.getElementById('s-qty').value), u=document.getElementById('s-unit').value, ty=document.getElementById('s-type').value;
    if(ty) S.types[norm(nm)]=ty; else ty=typeOf(nm);
    var r=ensureStock(nm,u,ty,guessAisle(nm));
    if(ty==='basique') r.st.have=true; else r.st.qty=num(r.st.qty)+(q||0);
    r.st.at=now(); if(ty==='frais') r.st.bought=now();
    save(); toast(cap(nm)+' ajouté au stock');
    var n2=document.getElementById('s-name'); if(n2) n2.focus();
  }
});
document.addEventListener('keydown',function(e){ if(e.key!=='Escape') return; if(view.expFor) ACT.expskip(); else if(view.prodFor) ACT.prodclose(); });
window.addEventListener('hashchange',function(){ view.prodFor=null; view.confirmDel=null; view.copyText=''; view.confirmRestore=null; var r=route(); if(r.indexOf('modifier-')!==0 && r!=='nouvelle'){ view.draftFor=null; } render(); });
render();
})();

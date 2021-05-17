/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */


 import 'react-native-get-random-values';
 import 'react-native-console-time-polyfill';
 import SEAL from 'node-seal/throws_js_web_umd';
 import React, {useState}  from 'react';
 // import type {Node} from 'react';
 import {Text,View,Button} from 'react-native';
 
 import * as data from './dati_aw/preprocessed_data_edited.json';
 



// Variabile globale che mantiene il minuto di osseervazione corrente
var current_minute = 0;

///////////////////////////////////////////////
//////////// Funzioni di utilità///////////////
///////////////////////////////////////////////

// Funzione di utilità che calcola le righe del dataset
const getSize = function(obj) {
  let size = 0,
  key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size - 1;
};

// Legge 10 record dell'attività svolta
const getActivitiesData = () => {
  let values_activities = [];
  let current = current_minute;
  for(let i=current; i<current+10; i++){
    values_activities.push(data[i].Activity_trimmed);
  }
  return values_activities;
}

// Legge 10 record del battito cardiaco
const getHeartBeatsData = () => {
  let values_heart_beats = [];
  let current = current_minute;
  for(let i=current; i<current+10; i++){
    values_heart_beats.push(data[i].Heart_beat);
  }
  return values_heart_beats;
}

//////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////  STEP 8  /////////////////////////////////////////////
//////  Il client decifra la media restituita dal server. Se maggiore di 80 manda  ///////
//////  un warning all'utente.                                                     ///////
//////  Torna a STEP 5.                                                            ///////
//////////////////////////////////////////////////////////////////////////////////////////
const decryptHeartBeatsAverage = async (context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed, ckksEncoder, encryptor, scale, decryptor, encryptedHeartBeatsAverage) => {
  global.document = {}
  try{
    console.time("STEP 8");
    console.log(">>> INIZIO STEP 8: Il client decifra la media restituita dal server")
    console.log("       >>> Se maggiore di 80 manda un warning all'utente.")
    console.log("       >>> Torna a STEP 5")

    // Load del Chipertext ricevuto dal server (String --> ChiperText)
    console.time("Load media heart beats");
    let Chipertext_HB_average_compressed = encryptedHeartBeatsAverage;
    let Chipertext_HB_average = seal.CipherText();
    Chipertext_HB_average.load(context, Chipertext_HB_average_compressed)
    console.timeEnd("Load media heart beats");
    
    // Decrypt media ritornata dal server (ChiperText -> PlainText)
    console.time("Decrypt media heart beats");
    let Plaintext_HB_average = seal.PlainText()
    decryptor.decrypt(Chipertext_HB_average,Plaintext_HB_average) 
    console.timeEnd("Decrypt media heart beats");

    // Decode Plaintext (Plaintext --> Array<Float>)
    console.time("Decode media heart beats");
    const media_in_chiaro = ckksEncoder.decode(Plaintext_HB_average)
    console.timeEnd("Decode media heart beats");

    // Media in chiaro
    const media_in_chiaro_arrotondata = Math.round(media_in_chiaro[0]);
    console.log('Media decodificata', media_in_chiaro[0])
    console.log('Media decodificata con arrotondamento', media_in_chiaro_arrotondata)
    console.log(" ")

    // Controllo se la media è > o < di due soglie
    if(media_in_chiaro_arrotondata > 80){
      console.warn("La media dei battiti è maggiore di 80")
    }else{
      console.log("La media dei battiti è nella norma")
    }

    console.log(" ")
    console.log(">>> FINE STEP 8")
    console.timeEnd("STEP 8");
    console.log(" ")
    // Torna a STEP 5 o termina l'esecuzione
  }catch(err){
    console.log(err)
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////  STEP 7  ////////////////////////////////////////////////////////// 
// Il client cifra gli heart beats e li invia al server. Il server ne restituisce la media al client. //
////////////////////////////////////////////////////////////////////////////////////////////////////////
const checkHeartBeats = async(context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed, ckksEncoder, encryptor, scale, decryptor) => {
  global.document = {}
  try{
    console.time("STEP 7");
    console.log(">>> INIZIO STEP 7: Il client cifra gli heart beats e li invia al server....")
    console.log("... Il server calcola la media e la restituisce al client")

    // Encode coeff. moltiplicativo per la media in un PlainText (Array<Float> --> PlainText --> String (compresso) )
    console.time("Encode coefficiente moltiplicativo")
    const coef = [0.1]
    const Plaintext_coef = seal.PlainText()
    ckksEncoder.encode(Float64Array.from(coef),scale,Plaintext_coef)
    const Plaintext_coef_compressed = Plaintext_coef.save()
    console.timeEnd("Encode coefficiente moltiplicativo")

    // Recupero i valori da cifrare
    const heart_beats = getHeartBeatsData();

    // Encode heart beats in un PlainText  (Array<Float> --> PlainText)
    console.time("Encode heart beats");
    const Plaintext_heart_beats = seal.PlainText()
    ckksEncoder.encode(Float64Array.from(heart_beats),scale,Plaintext_heart_beats)
    console.timeEnd("Encode heart beats");

    // Encypt heart beats --> (PlainText --> Chipertext --> String (compresso) )
    console.time("Encrypt heart beats");
    let Chipertext_heart_beats = await encryptor.encryptSerializable(Plaintext_heart_beats);
    let Chipertext_heart_beats_compressed = Chipertext_heart_beats.save();
    console.timeEnd("Encrypt heart beats");

    // Richiesta al server di calcolare la media degli heart beats
    await fetch('http://10.0.2.2:3000/getHeartBeatsAverage', {
      method: 'post',
      headers: {
        Accept: 'application/json','Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Chipertext: Chipertext_heart_beats_compressed,
        Galois: Galois_key_compressed,
        Relin: Relin_key_compressed,
        Plaintext_coef: Plaintext_coef_compressed
      })
    })
    .then(response => response.json())
    .then(encryptedHeartBeatsAverage => {
      console.log(">>> FINE STEP 7");
      console.timeEnd("STEP 7");
      console.log(" ");

      // Passa a STEP 8
      decryptHeartBeatsAverage(context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed, ckksEncoder, encryptor, scale, decryptor, encryptedHeartBeatsAverage['Chipertext_HB_average']);
    })
    .catch(error => alert("Error " + error));

  }catch(err){
    console.log(err)
  }
}

///////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////  STEP 6  ///////////////////////////////////////////
/////  Il client riceve dal server le activities sommate e può decifrarle.  ///////////
///////////  - se l'utente è a riposo --> STEP 7  /////////////////////////////////////
///////////  - altrimenti  -------------> STEP 5  /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
const decryptSumActivities = async (context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed, ckksEncoder, encryptor, decryptor, scale, sumEncrypted) => {
  global.document = {}
  try{
    console.time("STEP 6");
    console.log(">>> INIZIO STEP 6: Il client riceve dal server le activities sommate e può decifrarle")
    console.log("      >>> se l'utente è a riposo --> STEP 7")
    console.log("      >>> altrimenti --------------> Prossima iterazione (STEP 5)")

    // Load del Chipertext ricevuto dal server (String --> ChiperText)
    console.time("Load somma activities");
    let Chipertext_activities_sum_compressed = sumEncrypted;
    let Chipertext_activities_sum = seal.CipherText();
    Chipertext_activities_sum.load(context, Chipertext_activities_sum_compressed)
    console.timeEnd("Load somma activities");

    // Decrypt della somma ritornata dal server (Chipertext -> Plaintext)
    let Plaintext_activities_sum = seal.PlainText()
    console.time("Decrypt somma activities");
    decryptor.decrypt(Chipertext_activities_sum,Plaintext_activities_sum) 
    console.timeEnd("Decrypt somma activities");

    // Decode Plaintext (Plaintext --> Array<Float>)
    console.time("Decode somma acivities");
    const somma_in_chiaro = ckksEncoder.decode(Plaintext_activities_sum)
    console.timeEnd("Decode somma acivities");

    // Valori in chiaro
    const somma_in_chiaro_arrotondata = Math.round(somma_in_chiaro[0]);
    console.log("Somma activities: ", somma_in_chiaro[0])
    console.log("Somma activities con arrotondamento: ", somma_in_chiaro_arrotondata)
    
    console.log(">>> FINE STEP 6")
    console.timeEnd("STEP 6");
    console.log(" ")

    // Controllo se l'utente è a riposo
    if(somma_in_chiaro_arrotondata == 10){
      console.log("L'utente è a riposo")
      console.log(" ")

      // Passa a STEP 7: Controllo la media dei battiti cardiaci
      await checkHeartBeats(context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed, ckksEncoder, encryptor, scale, decryptor)
    }else{
      // Vai alla prossima iterazione
    }

  }catch(err){
    console.log(err)
  }

}


////////////////////////////////////////////////////////////////////////////
//////////////////////////////////  STEP 5  ////////////////////////////////
////  Il client cifra le activities e le invia al server. //////////////////
////  Il server restituisce al client le activities sommate tra di loro ////
////////////////////////////////////////////////////////////////////////////
const sendActivitiesToServer = async (context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed, ckksEncoder, encryptor,decryptor, scale) =>{
  global.document = {}
  try{
    console.log(" ")
    console.log("##########################################")
    console.log("#### CONTROLLO INTERVALLO: ",current_minute+1,' - ',current_minute+10)
    console.log("##########################################")
    console.time("STEP 5");
    console.log(">>> INIZIO STEP 5: Il client cifra le activities e le invia al server")
    console.log("... Il server restituisce al client le activities sommate tra di loro")

    // Recupero i valori da cifrare
    const activities = getActivitiesData();

    // Encode activities in un PlainText  (Array<Float> --> PlainText)
    console.time("Encode activities")
    const Plaintext_activities = seal.PlainText()
    ckksEncoder.encode(Float64Array.from(activities),scale,Plaintext_activities)
    console.timeEnd("Encode activities")

    // Encrypt activities  (PlainText --> Chipertext --> String (compresso) )
    console.time("Encrypt activities");
    let Chipertext_activities = await encryptor.encryptSerializable(Plaintext_activities);
    let Chipertext_activities_compressed = Chipertext_activities.save();
    console.timeEnd("Encrypt activities");
    
    // Richiesta al server di calcolare la somma delle activities
    await fetch('http://10.0.2.2:3000/getActivitiesSum', {
      method: 'post',
      headers: {
        Accept: 'application/json','Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Chipertext: Chipertext_activities_compressed,
        Galois: Galois_key_compressed
      })
    })
    .then(response => response.json())
    .then(sumEncrypted => {
      console.log(">>> FINE STEP 5")
      console.timeEnd("STEP 5");
      console.log(" ")
      // Passa a STEP 6
      decryptSumActivities(context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed, ckksEncoder, encryptor, decryptor,scale, sumEncrypted["Chipertext_sum"])
    })
    .catch(error => alert("Error " + error));
  }catch(err){
    console.log(err)
  }
}


///////////////////////////////////////////////////////////////////////////
//////////////////////////////////  STEP 4  ///////////////////////////////
//////////  Generazione CkksEncoder, Encryptor e Decryptor  ///////////////
///////////////////////////////////////////////////////////////////////////
const createEncDec = async (context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed) =>{
  global.document = {}
  try{
    console.time("STEP 4")
    console.log(">>> INIZIO STEP 4: Generazione CkksEncoder, Encryptor e Decryptor")

    // Crea un CkksEncoder
    console.time("Creazione CkksEncoder")
    const ckksEncoder = seal.CKKSEncoder(context)
    console.timeEnd("Creazione CkksEncoder")
    
    // Crea un Encryptor
    console.time("Creazione Encryptor")
    const encryptor = seal.Encryptor(context,Public_key)
    console.timeEnd("Creazione Encryptor")
    
    // Creo un decryptor
    console.time("Creazione Decryptor")
    const decryptor = seal.Decryptor(context,Secret_key)
    console.timeEnd("Creazione Decryptor")

    // Parametro di scaling per il ckksEncoder
    const scale = Math.pow(2, 30);

    console.log(">>> FINE STEP 4")
    console.timeEnd("STEP 4")
    console.log(" ")

    console.log("##################################")
    console.log("####### FINE FASE DI SETUP #######")
    console.log("##################################")
    console.timeEnd("Fase di configurazione")

    console.log(" ")
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
    console.log("@@@@@@ INIZIO ITERAZIONI @@@@@@@ ")
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")

    
    for(let i=current_minute; i<getSize(data)-10; i++){
      // Passa a STEP 5
      await sendActivitiesToServer(context, seal, Secret_key,Public_key, Relin_key_compressed, Galois_key_compressed, ckksEncoder, encryptor, decryptor, scale);
      current_minute++;
    }
    console.timeEnd("Tempo di esecuzione totale")
    }catch(err){
    console.log(err)
  }

}
///////////////////////////////////////////////////////////////////////////
//////////////////////////////////  STEP 3  ///////////////////////////////
////////////////////////  Generazione delle chiavi  ///////////////////////
///////////////////////////////////////////////////////////////////////////
const generateKeys = async (context, seal) =>{
  global.document = {}
  try{
    console.time("STEP 3");
    console.log(">>> INIZIO STEP 3: Generazione delle chiavi")

    // Crea un nuovo KeyGenerator
    console.time("Creazione KeyGenerator");
    const keyGenerator = seal.KeyGenerator(context)
    console.timeEnd("Creazione KeyGenerator");

    // Genera la SecretKey
    console.time("Creazione SecretKey");
    const Secret_key = keyGenerator.secretKey()
    console.timeEnd("Creazione SecretKey");

    // Genera la PublicKey
    console.time("Creazione PublicKey");
    const Public_key = keyGenerator.createPublicKey()
    console.timeEnd("Creazione PublicKey");
    
    // Genera la RelinKey
    console.time("Creazione RelinKey");
    const Relin_key = keyGenerator.createRelinKeysSerializable();
    const Relin_key_compressed = Relin_key.save();
    console.timeEnd("Creazione RelinKey");

    // Genera la GaloisKey
    console.time("Creazione GaloisKey");
    const Galois_key = keyGenerator.createGaloisKeysSerializable()
    const Galois_key_compressed = Galois_key.save();
    console.timeEnd("Creazione GaloisKey");
    
    console.log(">>> FINE STEP 3")
    console.timeEnd("STEP 3");
    console.log(" ")

    // Passa a STEP 4
    createEncDec(context, seal, Secret_key, Public_key, Relin_key_compressed, Galois_key_compressed)

  }catch(err){
    console.log(err)
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////  STEP 2  /////////////////////////////////////////////////
///// Il client carica il contesto tramite i parametri di encryption ricevuti dal server  /////
///////////////////////////////////////////////////////////////////////////////////////////////
const createContext = async (encParms) =>{
  global.document = {}
  try{
    console.time("STEP 2");
    console.log(">>> INIZIO STEP 2: Il client carica il contesto tramite i parametri di encryption...")
    console.log("... ricevuti dal server")

    // Attende il caricamento della libreria
    const seal = await SEAL();
    
    // Load parametri di encryption compressi  (String --> EncryptionParameters)
    console.time("Load Encryption Parameters")
    let loaded_encParms = seal.EncryptionParameters();
    loaded_encParms.load(encParms);
    console.timeEnd("Load Encryption Parameters")
    
    // Crea il contesto per SEAL
    console.time("Creazione del contesto");
    const securityLevel = seal.SecurityLevel.tc128  // Livello di sicurezza a 128 bit (minimo dello standard)
    const context = seal.Context(loaded_encParms,true,securityLevel)
    console.timeEnd("Creazione del contesto");

    // Controlla se il contesto è stato creato correttamente
    if (!context.parametersSet()) {
      throw new Error('Impossibile impostare i parametri nel contesto specificato. Prova diversi parametri di crittografia.')
    }
    
    console.log(">>> FINE STEP 2")
    console.timeEnd("STEP 2");
    console.log(" ")

    // Passa a STEP 3
    generateKeys(context, seal);

  }catch(err){
    console.log(err);
  }
}
    

/////////////////////////////////////////////////////////////////////////
////////////////////////////////  STEP 1  ///////////////////////////////
/////   Il client richiede i parametri di encryption al server.   ///////
/////   Il server restiuisce i parametri di encryption al client  ///////
/////////////////////////////////////////////////////////////////////////
const getEcryptionParms = async () => {
  console.log("")
  console.log("################################")
  console.log("##### INIZIO FASE DI SETUP #####")
  console.log("################################")
  console.log("")
  console.time("Tempo di esecuzione totale")
  console.time("Fase di configurazione")
  console.time("STEP 1");
  console.log(">>> INIZIO STEP 1: Il client richiede i parametri di encryption al server...")
  console.log("... Il server restiuisce i parametri di encryption al client.")
  
  // Richiesta dei parametri di Encryption al server 
  await fetch('http://10.0.2.2:3000/getEcryptionParms', {
    method: 'get',
    headers: {
      Accept: 'application/json','Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(encParms => {
    console.log(">>> FINE STEP 1")
    console.timeEnd("STEP 1");
    console.log(" ")

    // Passa a STEP 2
    createContext(encParms["encParms"])
  })
  .catch(error => alert("Error " + error));
}
 


const Button_start = (props) => {
  const [attivo, setAttivo] = useState(false);
  const [context, setContext] = useState(2);

  return(
    <View>
      <Button 
        onPress={() => {getEcryptionParms()}} 
        title = 'Avvia' 
      />
    </View>
  );
}
     
const App = () =>{
  return (
    <View>
      <View>
        <Text>Nome Applicazione</Text>
      </View>
      <View style={{justifyContent: "flex-end"}}>
        <Button_start></Button_start>
        <Text></Text>
      </View>
    </View>
    
  );
}
 
export default App;

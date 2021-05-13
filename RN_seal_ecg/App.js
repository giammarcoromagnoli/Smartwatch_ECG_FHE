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

import * as data from './dati_aw/preprocessed_data.json';

import {Text,View,Button} from 'react-native';


//legge i primi 10 record dell'attività svolta
const getActivitiesData = () => {
  let values_activities = [];
  for(let i=0; i<10; i++){
    values_activities.push(data[i].Activity_trimmed);
  }
  return values_activities;
  // console.log(values_activities);
}


// STEP 2: crea il contesto tramite i parametri restituiti dal server,
// genera le chiavi, invia al server i valori delle attività da sommare
const createContext = async (encParms) =>{
  global.document = {}
  // console.log(encParms["encParms"])
  try{

    //attende il caricamento della libreria
    const seal = await SEAL();
    
    ///////////////////////////
    ////// Setup iniziale //////
    ////////////////////////////
    
    //carica i parametri di cifratura compressi
    let loaded_encParms = seal.EncryptionParameters();
    loaded_encParms.load(encParms["encParms"]);
    
    //crea un livello di sicurezza a 128 bit (minimo dello standard)
    const securityLevel = seal.SecurityLevel.tc128
    
    // Crea il contesto
    console.time("Creazione del contesto");
    const context = seal.Context(loaded_encParms,true,securityLevel)
    console.timeEnd("Creazione del contesto");

    // Controlla se il contesto è stato creato correttamente
    if (!context.parametersSet()) {
      throw new Error('Impossibile impostare i parametri nel contesto specificato. Prova diversi parametri di crittografia.')
    }

    //////////////////////////
    // Generazione chiavi ////
    //////////////////////////

    console.time("Creazione delle chiavi");

    // Crea un nuovo KeyGenerator
    console.time("Creazione generatore di chiavi");
    const keyGenerator = seal.KeyGenerator(context)
    console.timeEnd("Creazione generatore di chiavi");

    // Genero la SecretKey dal keyGenerator
    console.time("Creazione chiave segreta");
    const Secret_key = keyGenerator.secretKey()
    console.timeEnd("Creazione chiave segreta");

    // Genero la PublicKey dal keyGenerator --> la comprimo per inviarla al server
    console.time("Creazione chiave pubblica");
    const Public_key = keyGenerator.createPublicKey()
    let Public_key_compressed = Public_key.save();
    console.timeEnd("Creazione chiave pubblica");
    
    // // Genero una RelinKey
    // console.time("Creazione chiave di riallineamento");
    // const Relin_key = keyGenerator.createRelinKeysSerializable();
    // const Relin_key_compressed = Relin_key.save();
    // console.timeEnd("Creazione chiave di riallineamento");

    // Genero una GaloisKey
    console.time("Creazione chiave di Galois");
    const Galois_key = keyGenerator.createGaloisKeysSerializable()
    const Galois_key_compressed = Galois_key.save();
    console.timeEnd("Creazione chiave di Galois");

    console.timeEnd("Creazione delle chiavi");

    // Recupero i valori da cifrare
    const activities = getActivitiesData()

    // Crea un CkksEncoder
    const ckksEncoder = seal.CKKSEncoder(context)
    
    // Crea un Encryptor
    // Fornendo al costruttore la Secret_key (se non si ha bisogno di utilizzare la Public_key),
    // i Chipertext generati dall'encryptor
    // saranno in uno stato seeded, così possono essere serializzati risparmiando 
    // molto spazio in memoria. Poi cifrare con il metodo 
    // Encryptor.encryptSymmetricSerializable(Plaintext) che restituisce un
    // Serializable.<Chipertext> 
    const encryptor = seal.Encryptor(context,Public_key)

    //parametro di scaling per il ckksEncoder
    const scale = Math.pow(2, 30);

    // Codifica activities in un PlainText
    const Plaintext_activities = seal.PlainText()
    ckksEncoder.encode(Float64Array.from(activities),scale,Plaintext_activities)

    // Cifratura delle activities --> Chipertext compresso per essere inviato al server
    console.time("Cifratura activities");
    let Chipertext_activities = encryptor.encryptSerializable(Plaintext_activities);
    let Chipertext_activities_compressed = Chipertext_activities.save();
    console.timeEnd("Cifratura activities");

    // creo un decryptor
    const decryptor = seal.Decryptor(context,Secret_key)

    //richiesta al server di calcolare la somma delle activities
    await fetch('http://10.0.2.2:3000/getActivitiesSum', {
      method: 'post',
      headers: {
        Accept: 'application/json','Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Chipertext: Chipertext_activities_compressed,
        Galois: Galois_key_compressed,
        PK: Public_key_compressed
      })
    })
    .then(response => response.json())
    .then(resp => {
      
      //estraggo il Chipertext ricevuto
      let Chipertext_activities_sum_compressed = resp["Chipertext_sum"];
      let Chipertext_activities_sum = seal.CipherText();
      Chipertext_activities_sum.load(context, Chipertext_activities_sum_compressed)
      
      let Plaintext_activities_sum = seal.PlainText()

      // Decifro la somma ritornata dal server (Chipertext -> Plaintext)
      console.time("Decifro la somma delle activities");
      decryptor.decrypt(Chipertext_activities_sum,Plaintext_activities_sum) 
      console.timeEnd("Decifro la somma delle activities");

      // Decodifico il Plaintext (Plaintext --> Array)
      console.time("Decode della somma");
      const somma_in_chiaro = ckksEncoder.decode(Plaintext_activities_sum)
      console.timeEnd("Decode della somma");

      console.log('Somma decodificata', somma_in_chiaro[0])
      console.log('Somma decodificata con arrotondamento', Math.round(somma_in_chiaro[0]))
        // console.log(response)
      })
    .catch(error => alert("Error " + error));

  }
    catch(err){
    console.log(err);
  }
}

//STEP 1: richiede encParms dal server
const getEcryptionParms = async () => {
  await fetch('http://10.0.2.2:3000/getEcryptionParms', {
    method: 'get',
    headers: {
      Accept: 'application/json','Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(encParms => {
    createContext(encParms)
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
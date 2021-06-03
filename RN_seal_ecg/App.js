/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */


 import 'react-native-get-random-values'
 import 'react-native-console-time-polyfill'
 import SEAL from 'node-seal/throws_js_web_umd'
 import React, {useState}  from 'react'
 // import type {Node} from 'react'
 import {Text,View,Button,StyleSheet} from 'react-native'
 
 import * as data from './dati_aw/preprocessed_data_edited.json'
 


const App = (props) =>{


  // Variabile globale che mantiene il minuto di osseervazione corrente
  var current_minute = 0

  // Variabili globali per registrare le performance
  var time = new Object()
  var time_step1 = []
  var time_step2 = []
  var time_step3 = []
  var time_step4 = []
  var time_step5 = []
  var time_step6 = []
  var time_step7 = []
  var time_step8 = []

  var time_contesto = []
  var time_key_generator = []
  var time_secret_key = []
  var time_public_key = []
  // var time_relin_key = []
  var time_galois_key = []
  var time_ckksencoder = []
  var time_encryptor = []
  var time_decryptor = []
  var time_setup = []

  var time_encode_activities = []
  var time_encrypt_activities = []

  var time_decrypt_activities = []
  var time_decode_activities = []

  var time_encode_coef = []
  var time_encode_hb = []
  var time_encrypt_hb = []

  var time_decrypt_hb = []
  var time_decode_hb = []

  var time_esecuzione_totale = []

  // Per calcolare l'errore
  var errore_ass_activities = []
  var errore_ass_hb = []
  

  var time_step1_start,time_step1_end,time_step2_start,time_step2_end,time_step3_start,time_step3_end,time_step4_start,time_step4_end,time_step5_start,time_step5_end,time_step6_start,time_step6_end,time_step7_start,time_step7_end,time_step8_start,time_step8_end,time_contesto_start,time_contesto_end,time_key_generator_start,time_key_generator_end,time_secret_key_start,time_secret_key_end,time_public_key_start,time_public_key_end,time_galois_key_start,time_galois_key_end,time_ckksencoder_start,time_ckksencoder_end,time_encryptor_start,time_encryptor_end,time_decryptor_start,time_decryptor_end,time_setup_start,time_setup_end,time_encode_activities_start,time_encode_activities_end,time_encrypt_activities_start,time_encrypt_activities_end,time_decrypt_activities_start,time_decrypt_activities_end,time_decode_activities_start,time_decode_activities_end,time_encode_coef_start,time_encode_coef_end,time_encode_hb_start,time_encode_hb_end,time_encrypt_hb_start,time_encrypt_hb_end,time_decrypt_hb_start,time_decrypt_hb_end,time_decode_hb_start,time_decode_hb_end,time_esecuzione_totale_start,time_esecuzione_totale_end
  // var time_relin_key_end, time_relin_key_start


  ///////////////////////////////////////////////
  //////////// Funzioni di utilità///////////////
  ///////////////////////////////////////////////

  // Funzione di utilità che calcola le righe del dataset
  const getSize = function(obj) {
    let size = 0,
    key
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++
    }
    return size - 1;
  }

  // Legge 10 record dell'attività svolta
  const getActivitiesData = () => {
    let values_activities = []
    let current = current_minute
    for(let i=current; i<current+10; i++){
      values_activities.push(data[i].Activity_trimmed)
    }
    return values_activities
  }

  // Legge 10 record del battito cardiaco
  const getHeartBeatsData = () => {
    let values_heart_beats = []
    let current = current_minute
    for(let i=current; i<current+10; i++){
      values_heart_beats.push(data[i].Heart_beat)
    }
    return values_heart_beats
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////  STEP 8  /////////////////////////////////////////////
  //////  Il client decifra la media restituita dal server. Se maggiore di 80 manda  ///////
  //////  un warning all'utente.                                                     ///////
  //////  Torna a STEP 5.                                                            ///////
  //////////////////////////////////////////////////////////////////////////////////////////
  const decryptHeartBeatsAverage = async (context, seal, ckksEncoder, decryptor, encryptedHeartBeatsAverage,media_esatta) => {
    global.document = {}
    try{
      time_step8_start = Math.round(performance.now());
      
      console.log(">>> INIZIO STEP 8: Il client decifra la media restituita dal server e controlla se è nella norma")
      console.log("       >>> Se maggiore di 80 manda un warning all'utente.")
      console.log("       >>> Torna a STEP 5")

      // Load del Chipertext ricevuto dal server (String --> ChiperText)
      let Chipertext_HB_average_compressed = encryptedHeartBeatsAverage;
      let Chipertext_HB_average = seal.CipherText();
      Chipertext_HB_average.load(context, Chipertext_HB_average_compressed)
      
      // Decrypt media ritornata dal server (ChiperText -> PlainText)
      time_decrypt_hb_start = Math.round(performance.now());
      let Plaintext_HB_average = seal.PlainText()
      decryptor.decrypt(Chipertext_HB_average,Plaintext_HB_average) 
      time_decrypt_hb_end = Math.round(performance.now());
      console.log("Decrypt media heart beats:", time_decrypt_hb_end - time_decrypt_hb_start,"ms")
      time_decrypt_hb.push(time_decrypt_hb_end - time_decrypt_hb_start)

      // Decode Plaintext (Plaintext --> Array<Float>)
      time_decode_hb_start = Math.round(performance.now());
      const media_in_chiaro = ckksEncoder.decode(Plaintext_HB_average)
      time_decode_hb_end = Math.round(performance.now());
      console.log("Decode media heart beats:", time_decode_hb_end - time_decode_hb_start,"ms")
      time_decode_hb.push(time_decode_hb_end - time_decode_hb_start)

      // Media in chiaro
      // const media_in_chiaro_arrotondata = Math.round(media_in_chiaro[0]);
      console.log('Media calcolata', media_in_chiaro[0])
      console.log('Media esatta', media_esatta)
      
      // Calcolo l'errore assoluto
      const errore_assoluto_heart_beats = media_in_chiaro[0] - media_esatta;
      errore_ass_hb.push(errore_assoluto_heart_beats)
      console.log("Errore assoulto heart beats: ", errore_assoluto_heart_beats)
      console.log(" ")

      // Controllo se la media è > o < di due soglie
      if(media_in_chiaro[0] > 80){
        // console.warn("La media dei battiti è maggiore di 80")

        // Per l'interfaccia
        setBackColor("salmon")
      }else{
        console.log("La media dei battiti è nella norma")

        // Per l'interfaccia
        setBackColor("springgreen")
      }

      // Per l'interfaccia
      setFrequenza(media_in_chiaro[0])

      // Deallocazione risorse
      Chipertext_HB_average.delete()
      Plaintext_HB_average.delete()

      console.log(" ")
      console.log(">>> FINE STEP 8")
      
      time_step8_end = Math.round(performance.now())
      console.log("STEP 8:", time_step8_end - time_step8_start,"ms")
      time_step8.push(time_step8_end - time_step8_start)

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
  const checkHeartBeats = async(context, seal, Galois_key_compressed, ckksEncoder, encryptor, scale, decryptor) => {
    global.document = {}
    try{
      time_step7_start = Math.round(performance.now())
      
      console.log(">>> INIZIO STEP 7: Il client cifra i battiti e li invia al server....")
      console.log("... Il server calcola la media e la restituisce al client")

      // Encode coeff. moltiplicativo per la media in un PlainText (Array<Float> --> PlainText --> String (compresso))
      time_encode_coef_start = Math.round(performance.now())
      const coef = [0.1]
      const Plaintext_coef = seal.PlainText()
      ckksEncoder.encode(Float64Array.from(coef),scale,Plaintext_coef)
      const Plaintext_coef_compressed = Plaintext_coef.save()
      time_encode_coef_end = Math.round(performance.now())
      console.log("Encode coefficiente moltiplicativo:", time_encode_coef_end - time_encode_coef_start,"ms")
      time_encode_coef.push(time_encode_coef_end - time_encode_coef_start)
     
      // Recupera i valori da cifrare
      const heart_beats = getHeartBeatsData()

      // Calcola la media esatta
      let media_esatta = 0
      for(let i = 0; i<heart_beats.length; i++)
        media_esatta += heart_beats[i]
      media_esatta=media_esatta/heart_beats.length

      // Encode battiti in un PlainText  (Array<Float> --> PlainText)
      time_encode_hb_start = Math.round(performance.now())
      const Plaintext_heart_beats = seal.PlainText()
      ckksEncoder.encode(Float64Array.from(heart_beats),scale,Plaintext_heart_beats)
      time_encode_hb_end = Math.round(performance.now())
      console.log("Encode battiti:", time_encode_hb_end - time_encode_hb_start,"ms")
      time_encode_hb.push(time_encode_hb_end - time_encode_hb_start)
      
 
      // Encrypt battiti --> (PlainText --> Chipertext --> String (compresso))
      time_encrypt_hb_start = Math.round(performance.now())
      let Chipertext_heart_beats = encryptor.encryptSerializable(Plaintext_heart_beats)
      let Chipertext_heart_beats_compressed = Chipertext_heart_beats.save()
      time_encrypt_hb_end = Math.round(performance.now())
      console.log("Encrypt battiti:", time_encrypt_hb_end - time_encrypt_hb_start,"ms")
      time_encrypt_hb.push(time_encrypt_hb_end - time_encrypt_hb_start)
      
      // Richiesta al server di calcolare la media dei battiti
      await fetch('http://10.0.2.2:3000/getHeartBeatsAverage', {
        method: 'post',
        headers: {
          Accept: 'application/json','Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Chipertext: Chipertext_heart_beats_compressed,
          Galois: Galois_key_compressed,
          Plaintext_coef: Plaintext_coef_compressed
        })
      })
      .then(response => response.json())
      .then(encryptedHeartBeatsAverage => {
        console.log(">>> FINE STEP 7")
        time_step7_end = Math.round(performance.now());
        console.log("STEP 7:", time_step7_end - time_step7_start,"ms")
        time_step7.push(time_step7_end - time_step7_start)
        
        console.log(" ")

        // Deallocazione risorse
        Plaintext_coef.delete()
        Plaintext_heart_beats.delete()
        Chipertext_heart_beats.delete()

        // Passa a STEP 8
        decryptHeartBeatsAverage(context, seal, ckksEncoder, decryptor, encryptedHeartBeatsAverage['Chipertext_HB_average'],media_esatta)
      })
      .catch(error => alert("Error " + error))

    }catch(err){
      console.log(err)
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////  STEP 6  ///////////////////////////////////////////
  /////  Il client controlla se l'utente è a riposo.  ///////////
  ///////////  - se l'utente è a riposo --> STEP 7  /////////////////////////////////////
  ///////////  - altrimenti  -------------> STEP 5  /////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////
  const decryptSumActivities = async (context, seal, Galois_key_compressed, ckksEncoder, encryptor, decryptor, scale, sumEncrypted) => {
    global.document = {}
    try{
      time_step6_start = Math.round(performance.now())
      
      console.log(">>> INIZIO STEP 6: Il client controlla se l'utente è a riposo")
      console.log("      >>> se l'utente è a riposo --> STEP 7")
      console.log("      >>> altrimenti --------------> Prossima iterazione (STEP 5)")

      // Load del Chipertext ricevuto dal server (String --> ChiperText)
      let Chipertext_activities_sum_compressed = sumEncrypted
      let Chipertext_activities_sum = seal.CipherText()
      Chipertext_activities_sum.load(context, Chipertext_activities_sum_compressed)

      // Decrypt della somma ritornata dal server (Chipertext -> Plaintext)
      let Plaintext_activities_sum = seal.PlainText()
      time_decrypt_activities_start = Math.round(performance.now())
      decryptor.decrypt(Chipertext_activities_sum,Plaintext_activities_sum) 
      time_decrypt_activities_end = Math.round(performance.now())
      console.log("Decrypt somma activities:", time_decrypt_activities_end - time_decrypt_activities_start,"ms")
      time_decrypt_activities.push(time_decrypt_activities_end - time_decrypt_activities_start)

      // Decode Plaintext (Plaintext --> Array<Float>)
      time_decode_activities_start = Math.round(performance.now())
      const somma_in_chiaro = ckksEncoder.decode(Plaintext_activities_sum)
      time_decode_activities_end = Math.round(performance.now())
      console.log("Decode somma activities:", time_decode_activities_end - time_decode_activities_start,"ms")
      time_decode_activities.push(time_decode_activities_end - time_decode_activities_start)

      // Valori in chiaro
      const somma_in_chiaro_arrotondata = Math.round(somma_in_chiaro[0])
      console.log("Somma activities: ", somma_in_chiaro[0])
      console.log("Somma activities con arrotondamento: ", somma_in_chiaro_arrotondata)
      
      // Calcola l'errore assoluto
      const errore_assoluto_activities = somma_in_chiaro[0] - somma_in_chiaro_arrotondata
      errore_ass_activities.push(errore_assoluto_activities)
      console.log("Errore assoulto activities: ", errore_assoluto_activities)

      // Deallocazione risorse
      Chipertext_activities_sum.delete()
      Plaintext_activities_sum.delete()

      console.log(">>> FINE STEP 6")
      time_step6_end = Math.round(performance.now())
      console.log("STEP 6:", time_step6_end - time_step6_start,"ms")
      time_step6.push(time_step6_end - time_step6_start)
      console.log(" ")

      // Per l'interfaccia
      setFrequenza(0)

      // Controlla se l'utente è a riposo
      if(somma_in_chiaro_arrotondata == 10){
        // Per l'interfaccia
        setStato("A riposo")
        console.log("L'utente è a riposo")
        console.log(" ")

        // Passa a STEP 7: Controllo la media dei battiti cardiaci
        await checkHeartBeats(context, seal, Galois_key_compressed, ckksEncoder, encryptor, scale, decryptor)
      }else{
        // Vai alla prossima iterazione
        // Per l'interfaccia
        setStato("Non a riposo")
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
  const sendActivitiesToServer = async (context, seal, Galois_key_compressed, ckksEncoder, encryptor,decryptor, scale) =>{
    global.document = {}
    try{
      console.log(" ")
      console.log("##########################################")
      console.log("#### CONTROLLO INTERVALLO: ",current_minute+1,' - ',current_minute+10)
      console.log("##########################################")
      time_step5_start = Math.round(performance.now());
      
      console.log(">>> INIZIO STEP 5: Il client cifra le attività e le invia al server")
      console.log("... Il server restituisce al client la somma delle attività")

      // Recupera i valori da cifrare
      const activities = getActivitiesData()

      // Encode attività in un PlainText  (Array<Float> --> PlainText)
      time_encode_activities_start = Math.round(performance.now())
      const Plaintext_activities = seal.PlainText()
      ckksEncoder.encode(Float64Array.from(activities),scale,Plaintext_activities)
      time_encode_activities_end = Math.round(performance.now())
      console.log("Encode activities:", time_encode_activities_end - time_encode_activities_start,"ms")
      time_encode_activities.push(time_encode_activities_end - time_encode_activities_start)

      // Encrypt attività  (PlainText --> Chipertext --> String (compresso) )
      time_encrypt_activities_start = Math.round(performance.now())
      let Chipertext_activities = encryptor.encryptSerializable(Plaintext_activities)
      let Chipertext_activities_compressed = Chipertext_activities.save()
      time_encrypt_activities_end = Math.round(performance.now())
      console.log("Encrypt activities:", time_encrypt_activities_end - time_encrypt_activities_start,"ms")
      time_encrypt_activities.push(time_encrypt_activities_end - time_encrypt_activities_start)
      
      // Richiesta al server di calcolare la somma delle attività
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
        time_step5_end = Math.round(performance.now());
        console.log("STEP 5:", time_step5_end - time_step5_start,"ms")
        time_step5.push(time_step5_end - time_step5_start)
        
        console.log(" ")

        // Deallocazione risorse
        Plaintext_activities.delete()
        Chipertext_activities.delete()
        // Passa a STEP 6
        decryptSumActivities(context, seal, Galois_key_compressed, ckksEncoder, encryptor, decryptor,scale, sumEncrypted["Chipertext_sum"])
      })
      .catch(error => alert("Error " + error))
    }catch(err){
      console.log(err)
    }
  }


  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////////  STEP 4  ///////////////////////////////
  //////////  Generazione CkksEncoder, Encryptor e Decryptor  ///////////////
  ///////////////////////////////////////////////////////////////////////////
  const createEncDec = async (context, seal, Secret_key,Public_key, Galois_key_compressed, scale) =>{
    global.document = {}
    try{
      
      time_step4_start = Math.round(performance.now());
      console.log(">>> INIZIO STEP 4: Generazione CkksEncoder, Encryptor e Decryptor")

      // Crea un CkksEncoder
      time_ckksencoder_start = Math.round(performance.now())
      const ckksEncoder = seal.CKKSEncoder(context)
      time_ckksencoder_end = Math.round(performance.now())
      console.log("Creazione CkksEncoder:", time_ckksencoder_end - time_ckksencoder_start,"ms")
      time_ckksencoder.push(time_ckksencoder_end - time_ckksencoder_start)
      
      // Crea un Encryptor
      time_encryptor_start = Math.round(performance.now())
      const encryptor = seal.Encryptor(context,Public_key)
      time_encryptor_end = Math.round(performance.now())
      console.log("Creazione Encryptor:", time_encryptor_end - time_encryptor_start,"ms")
      time_encryptor.push(time_encryptor_end - time_encryptor_start)
      
      // Crea un decryptor
      time_decryptor_start = Math.round(performance.now())
      const decryptor = seal.Decryptor(context,Secret_key)
      time_decryptor_end = Math.round(performance.now())
      console.log("Creazione Decryptor:", time_decryptor_end - time_decryptor_start,"ms")
      time_decryptor.push(time_decryptor_end - time_decryptor_start)

      console.log(">>> FINE STEP 4")
      
      time_step4_end = Math.round(performance.now())
      console.log("STEP 4:", time_step4_end - time_step4_start,"ms")
      time_step4.push(time_step4_end - time_step4_start)
      console.log(" ")

      // Per l'interfaccia
      setSetup(false)
      console.log("##################################")
      console.log("####### FINE FASE DI SETUP #######")
      console.log("##################################")
      
      time_setup_end = Math.round(performance.now())
      console.log("Fase di setup:", time_setup_end - time_setup_start,"ms")
      time_setup.push(time_setup_end - time_setup_start)

      console.log(" ")
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
      console.log("@@@@@@ INIZIO ITERAZIONI @@@@@@@ ")
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")

      
      for(let i=current_minute; i<getSize(data)-10; i++){
        // Passa a STEP 5
        // Per l'interfaccia
        setIntervallo(current_minute)
        await sendActivitiesToServer(context, seal, Galois_key_compressed, ckksEncoder, encryptor, decryptor, scale)
        current_minute++
      }

      // Deallocazione risorse
      Secret_key.delete()
      Public_key.delete()
      ckksEncoder.delete()
      encryptor.delete()
      decryptor.delete()
      context.delete()

      time_esecuzione_totale_end = Math.round(performance.now())
      console.log("Tempo di esecuzione totale:", time_esecuzione_totale_end - time_esecuzione_totale_start,"ms")
      time_esecuzione_totale.push(time_esecuzione_totale_end - time_esecuzione_totale_start)

      /////////////////////////////
      // Per le performance
      /////////////////////////////
      time.step1 = time_step1
      time.step2 = time_step2
      time.step3 = time_step3
      time.step4 = time_step4
      time.step5 = time_step5
      time.step6 = time_step6
      time.step7 = time_step7
      time.step8 = time_step8

      //step 1-4
      time.contesto = time_contesto
      time.key_generator = time_key_generator
      time.secret_key = time_secret_key
      time.public_key = time_public_key
      
      // time.relin_key = time_relin_key
      time.galois_key = time_galois_key
      time.ckksencoder = time_ckksencoder
      time.encryptor = time_encryptor
      time.decryptor = time_decryptor
      time.setup = time_setup

      //step 5
      time.encode_activities = time_encode_activities
      time.encrypt_activities = time_encrypt_activities

      //step 6
      time.decrypt_activities = time_decrypt_activities
      time.decode_activities = time_decode_activities
      
      //step 7
      time.encode_coef = time_encode_coef
      time.encode_hb = time_encode_hb
      time.encrypt_hb = time_encrypt_hb

      //step 8
      time.decrypt_hb = time_decrypt_hb
      time.decode_hb = time_decode_hb

      time.esecuzione_totale = time_esecuzione_totale

      //errore
      time.errore_activities = errore_ass_activities
      time.errore_hb = errore_ass_hb

      var timeJsonString= JSON.stringify(time)
      console.log(timeJsonString)

      }catch(err){
      console.log(err)
    }

  }
  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////////  STEP 3  ///////////////////////////////
  ////////////////////////  Generazione delle chiavi  ///////////////////////
  ///////////////////////////////////////////////////////////////////////////
  const generateKeys = async (context, seal, scale) =>{
    global.document = {}
    try{
      time_step3_start = Math.round(performance.now())
      console.log(">>> INIZIO STEP 3: Generazione delle chiavi")

      // Crea un KeyGenerator
      time_key_generator_start = Math.round(performance.now())
      const keyGenerator = seal.KeyGenerator(context)
      time_key_generator_end = Math.round(performance.now())
      console.log("Creazione KeyGenerator:", time_key_generator_end - time_key_generator_start,"ms")
      time_key_generator.push(time_key_generator_end - time_key_generator_start)

      // Genera la SecretKey
      time_secret_key_start = Math.round(performance.now())
      const Secret_key = keyGenerator.secretKey()
      time_secret_key_end = Math.round(performance.now())
      console.log("Creazione SecretKey:", time_secret_key_end - time_secret_key_start,"ms")
      time_secret_key.push(time_secret_key_end - time_secret_key_start)

      // Genera la PublicKey
      time_public_key_start = Math.round(performance.now())
      const Public_key = keyGenerator.createPublicKey()
      time_public_key_end = Math.round(performance.now())
      console.log("Creazione PublicKey:", time_public_key_end - time_public_key_start,"ms")
      time_public_key.push(time_public_key_end - time_public_key_start)
      
      // Genera la RelinKey --> non necessaria
      // time_relin_key_start = Math.round(performance.now())
      // const Relin_key = keyGenerator.createRelinKeysSerializable();
      // const Relin_key_compressed = Relin_key.save()
      // time_relin_key_end = Math.round(performance.now());
      // console.log("Creazione RelinKey:", time_relin_key_end - time_relin_key_start,"ms")
      // time_relin_key.push(time_relin_key_end - time_relin_key_start)

      // Genera la GaloisKey
      time_galois_key_start = Math.round(performance.now())
      const Galois_key = keyGenerator.createGaloisKeysSerializable()
      const Galois_key_compressed = Galois_key.save()
      time_galois_key_end = Math.round(performance.now())
      console.log("Creazione GaloisKey:", time_galois_key_end - time_galois_key_start,"ms")
      time_galois_key.push(time_galois_key_end - time_galois_key_start)
      
      console.log(">>> FINE STEP 3")
      time_step3_end = Math.round(performance.now());
      console.log("STEP 3:", time_step3_end - time_step3_start,"ms")
      time_step3.push(time_step3_end - time_step3_start)
      console.log(" ")

      // Deallocazione risorse
      Galois_key.delete()
      // Relin_key.delete()
      keyGenerator.delete()

      // Passa a STEP 4
      createEncDec(context, seal, Secret_key, Public_key, Galois_key_compressed, scale)

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
      time_step2_start = Math.round(performance.now())
      console.log(">>> INIZIO STEP 2: Il client carica il contesto tramite i parametri di encryption...")
      console.log("... ricevuti dal server")

      // Attende il caricamento della libreria
      const seal = await SEAL()
      
      // Load parametri di encryption compressi  (String --> EncryptionParameters)
      let EncryptionParms = seal.EncryptionParameters()
      EncryptionParms.load(encParms)
    
      // Crea il contesto per SEAL
      time_contesto_start = Math.round(performance.now())
      const securityLevel = seal.SecurityLevel.tc128
      const context = seal.Context(EncryptionParms,true,securityLevel)
      time_contesto_end = Math.round(performance.now())
      console.log("Creazione del contesto:", time_contesto_end - time_contesto_start,"ms")
      time_contesto.push(time_contesto_end - time_contesto_start)

      // Controlla se il contesto è stato creato correttamente
      if (!context.parametersSet()) {
        throw new Error('Impossibile impostare i parametri nel contesto specificato. Prova diversi parametri di encryption.')
      }

      // Parametro di scaling per il CkksEncoder
      const scale = Math.pow(2, 30)
      
      console.log(">>> FINE STEP 2")
      time_step2_end = Math.round(performance.now())
      console.log("STEP 2:", time_step2_end - time_step2_start,"ms")
      time_step2.push(time_step2_end - time_step2_start)
      console.log(" ")

      // Deallocazione risorse
      EncryptionParms.delete()

      // Passa a STEP 3
      generateKeys(context, seal, scale)

    }catch(err){
      console.log(err)
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
    
    time_esecuzione_totale_start = Math.round(performance.now())
    time_setup_start = Math.round(performance.now())
    time_step1_start = Math.round(performance.now())
    console.log(">>> INIZIO STEP 1: Richiesta dei parametri di encryption al server.")
    console.log("... Il server restiuisce i parametri di encryption.")
    
    // Per l'interfaccia
    setSetup(true)
    
    // Richiesta dei parametri di encryption al server 
    await fetch('http://10.0.2.2:3000/getEcryptionParms', {
      method: 'get',
      headers: {
        Accept: 'application/json','Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(encParms => {
      console.log(">>> FINE STEP 1")
      console.log(" ")

      time_step1_end = Math.round(performance.now())
      console.log("STEP 1:", time_step1_end - time_step1_start,"ms")
      time_step1.push(time_step1_end - time_step1_start)

      // Passa a STEP 2
      createContext(encParms["encParms"])
    })
    .catch(error => alert("Error " + error));
  }


  // State del componente App
  const [inEsecuzione, setInEsecuzione] = useState(false)
  const [setup, setSetup] = useState(true)
  const [intervallo, setIntervallo] = useState(0)
  const [stato, setStato] = useState("...")
  const [frequenza, setFrequenza] = useState(0)
  const [backColor, setBackColor] = useState("white")

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Controllo frequenza cardiaca tramite FHE</Text>
      <View>
        <Text style={styles.fase}>{!inEsecuzione ? ' ' : setup ? 'Fase di setup': 'Fase iterativa'}</Text>
        {setup ? 
        <View>
            <Text style={styles.standard}></Text>
            <Text style={styles.standard}></Text>
            <Text  style={{marginTop:20,textAlign:'center',fontSize: 25}}></Text>
        </View> :
        <View >
          <Text style={styles.standard}>Intervallo {intervallo+1} - {intervallo+10}</Text>
          <Text style={styles.standard}>Stato: {stato} </Text>
          <Text style={{marginTop:30,textAlign:'center',fontSize: 25, backgroundColor: frequenza == 0 ? "whitesmoke" : backColor}}>
            {stato == 'A riposo' ? 'Frequenza cardiaca: ' + frequenza : ' '}
          </Text>
        </View>
        }
      </View>
      <View style={styles.button}>
        <Button 
          onPress={() => {getEcryptionParms(); setInEsecuzione(true)}} 
          title = {inEsecuzione ? "Stop" : 'Start'} 
        />
      </View>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    padding:50,
    height: '100%',
    backgroundColor:'whitesmoke', 
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 25,
    marginBottom: 20,
  },
  fase:{
    marginTop:30,
    marginBottom:30,
    textAlign:'center',
    fontSize: 25,
  },
  standard: {
    marginTop:30,
    textAlign:'center',
    fontSize: 25,
  },
  button: {
    justifyContent: 'flex-end',
    marginTop:80,
  }
});

export default App;

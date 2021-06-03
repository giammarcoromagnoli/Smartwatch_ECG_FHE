(async () => {

    //node-seal
    const SEAL = require('node-seal/throws_wasm_node_umd')
    const seal = await SEAL()
    //Express
    const express = require('express')
    const app = express()
    const port = 3000
    
    // Crea i parametri per l'Encryption
    const schemeType = seal.SchemeType.ckks
    const securityLevel = seal.SecurityLevel.tc128
    const polyModulusDegree = 4096
    const bitCoefSizes = [46,16,46]
    
    // Seleziona lo schema
    const encParms = seal.EncryptionParameters(schemeType)
    // Assegna il grado del modulo del polinomio
    encParms.setPolyModulusDegree(polyModulusDegree)
    // Assegna un insieme adatto di primi per il modulo del coefficiente
    encParms.setCoeffModulus(seal.CoeffModulus.Create(polyModulusDegree,Int32Array.from(bitCoefSizes)))

    // Crea un nuovo contesto
    const context = seal.Context(encParms,true,securityLevel)

    // Controlla se il contesto è stato creato correttamente
    if (!context.parametersSet()) {
      throw new Error('Impossibile impostare i parametri nel contesto specificato. Prova diversi parametri di encryption.')
    }
    // Crea l'Evaluator
    const evaluator = seal.Evaluator(context)

    // Comprime i parametri di encryption
    const string_encParms = encParms.save()
 
    // Assegna dimensione massima di parsing
    app.use(express.json({limit:'200mb'}))

    // Server in ascolto
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`)
    })

    //API 1: Restituisce i parametri di encryption
    app.get('/getEcryptionParms', (req, res) => {
      res.json({encParms: string_encParms})
    })

    //API 2: Effettua la somma cifrata delle attività e la restituisce al client
    app.post('/getActivitiesSum', (req, res) => {
      
      // Decomprime il chipertext
      let Chipertext_activities_compressed = req.body['Chipertext']
      let Chipertext_activities = seal.CipherText()
      Chipertext_activities.load(context, Chipertext_activities_compressed)
      
      // Decomprime la chiave di galois
      let Galois_key = seal.GaloisKeys()
      let Galois_key_compressed = req.body['Galois']
      Galois_key.load(context, Galois_key_compressed)
      
      // Somma tutti gli elementi dell'array in maniera cifrata
      let Chipertext_activities_sum = seal.CipherText()
      evaluator.sumElements(Chipertext_activities,Galois_key,seal.SchemeType.ckks,Chipertext_activities_sum) 
       
      // Comprime la somma
      let Chipertext_activities_sum_compressed = seal.CipherText()
      Chipertext_activities_sum_compressed = Chipertext_activities_sum.save()
     
      // Restituisce la somma
      res.json({Chipertext_sum: Chipertext_activities_sum_compressed})
    })

    // API 3: Calcola la media dei battiti e la restituisce al client
    app.post('/getHeartBeatsAverage', (req, res) => {
      
      // Decomprime i battiti
      let Chipertext_heart_beats_compressed = req.body['Chipertext']
      let Chipertext_heart_beats = seal.CipherText()
      Chipertext_heart_beats.load(context,Chipertext_heart_beats_compressed)
      
      // Decomprime la chiave di Galois
      let Galois_key_compressed = req.body['Galois']
      let Galois_key = seal.GaloisKeys()
      Galois_key.load(context, Galois_key_compressed)

      // Decomprime la chiave di relin
      // let Relin_key_compressed = req.body['Relin']
      // let Relin_key = seal.RelinKeys()
      // Relin_key.load(context, Relin_key_compressed)
      
      // Decomprime il plaintext (coefficiente 0.1)
      let Plaintext_coef_compressed = req.body['Plaintext_coef']
      let Plaintext_coef = seal.PlainText()
      Plaintext_coef.load(context, Plaintext_coef_compressed)
    
      // Somma tutti gli elementi dell'array in maniera cifrata
      let Chipertext_heart_beats_sum = seal.CipherText()
      evaluator.sumElements(Chipertext_heart_beats,Galois_key,seal.SchemeType.ckks,Chipertext_heart_beats_sum) 
        
      // Calcola la media
      let Chipertext_heart_beats_average = seal.CipherText()
      evaluator.multiplyPlain(Chipertext_heart_beats_sum,Plaintext_coef,Chipertext_heart_beats_average)
      

      // Riallinea la media --> non necessaria
      // evaluator.relinearize(Chipertext_heart_beats_average,Relin_key,Chipertext_heart_beats_average_relin)
      
      // Scala la media al prossimo indici della catena di modulus switching --> non necessaria
      // const Chiper_rescaled = evaluator.rescaleToNext(Chipertext_heart_beats_average_relin)

      // Comprime la media dei battiti
      let Chipertext_heart_beats_average_compressed = seal.CipherText()
      Chipertext_heart_beats_average_compressed = Chipertext_heart_beats_average.save()
      
      // Restituisce la media dei battiti
      res.json({Chipertext_HB_average: Chipertext_heart_beats_average_compressed})
    })

  })()

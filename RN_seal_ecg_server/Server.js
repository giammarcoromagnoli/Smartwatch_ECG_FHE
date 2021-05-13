;(async () => {

    //node-seal
    const SEAL = require('node-seal/throws_wasm_node_umd')
    const seal = await SEAL()

    //Express
    const express = require('express')
    const app = express()
    const port = 3000

    ///////////////////////////////
    // Parametri di Encryption ////
    ///////////////////////////////
    
    // Crea i parametri per l'Encryption
    const schemeType = seal.SchemeType.ckks
    const securityLevel = seal.SecurityLevel.tc128
    const polyModulusDegree = 4096
    const bitSizes = [46,16,46]
    
    const encParms = seal.EncryptionParameters(schemeType)

    // Assegna il grado del modulo del polinomio
    encParms.setPolyModulusDegree(polyModulusDegree)

    // Assegna un insieme adatto di primi per il modulo del coefficiente
    encParms.setCoeffModulus(seal.CoeffModulus.Create(polyModulusDegree,Int32Array.from(bitSizes)))

    // Crea un nuovo contesto
    const context = seal.Context(encParms,true,securityLevel)

    // Controlla se il contesto è stato creato correttamente
    if (!context.parametersSet()) {
      throw new Error('Impossibile impostare i parametri nel contesto specificato. Prova diversi parametri di crittografia.')
    }

    const string_encParms = encParms.save();
    
    // app.use(express.json()) // for parsing application/json
    app.use(express.json({limit:'200mb'}));
    // app.use(bodyParser.json()); 
    // app.use(bodyParser.urlencoded({ extended: false })); 

    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`)
    })

    app.get('/getEcryptionParms', (req, res) => {
      // console.log("type of encParms:"+typeof(string_encParms))
      res.json({encParms: string_encParms})
    })

    app.post('/getActivitiesSum', (req, res) => {
      // console.log(req.body)

      let Chipertext_activities_compressed = req.body['Chipertext'];
      let Chipertext_activities = seal.CipherText();
      Chipertext_activities.load(context, Chipertext_activities_compressed)
      console.log("ho caricato Chipertext_activities")

      let Galois_key_compressed = req.body['Galois'];
      let Galois_key = seal.GaloisKeys()
      Galois_key.load(context, Galois_key_compressed)
      console.log("ho caricato la chiave di Galois")

      let Public_key_compressed = req.body['PK'];
      let Public_key = seal.PublicKey()
      Public_key.load(context, Public_key_compressed)
      console.log("ho caricato la chiave pubblica")

      let Chipertext_activities_sum = seal.CipherText()

      const evaluator = seal.Evaluator(context)
      console.log("ho creato il valutatore")

      // somma tutti gli elementi dell'array in maniera cifrata
      evaluator.sumElements(Chipertext_activities,Galois_key,seal.SchemeType.ckks,Chipertext_activities_sum) 
      console.log("ho sommato i valori cifrati")   
      

      let Chipertext_activities_sum_compressed = seal.CipherText();
      Chipertext_activities_sum_compressed = Chipertext_activities_sum.save();
      console.log("ho compresso i valori sommati")
      
      res.json({Chipertext_sum: Chipertext_activities_sum_compressed})
    })
    

    



    

    

    

  })()
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
 import 'react-native-get-random-values'
 import SEAL from 'node-seal/throws_wasm_web_umd'
 import React, {useState}  from 'react';
 // import type {Node} from 'react';
 
 import {Text,View,Button} from 'react-native';
 
 
 async function handle() {
   global.document = {}
   // Wait for the library to initialize
   const seal = await SEAL()
   // Create a new EncryptionParameters
 
   const schemeType = seal.SchemeType.ckks
   const securityLevel = seal.SecurityLevel.tc128
   const polyModulusDegree = 8192
   const bitSizes = [60,20,20,20,20,60]
   
   const encParms = seal.EncryptionParameters(schemeType)
 
   // Assign Poly Modulus Degree
   encParms.setPolyModulusDegree(polyModulusDegree)
   
   // Create a suitable set of CoeffModulus primes
   encParms.setCoeffModulus(seal.CoeffModulus.Create(polyModulusDegree,Int32Array.from(bitSizes)))
 
   ////////////////////////
   // Context
   ////////////////////////
   
   // Create a new Context
   const context = seal.Context(encParms,true,securityLevel)
 
   // Helper to check if the Context was created successfully
   if (!context.parametersSet()) {
     throw new Error('Could not set the parameters in the given context. Please try different encryption parameters.')
   } 
 
 };
 
 const But = (props) => {
   const [attivo, setAttivo] = useState(false);
   const [context, setContext] = useState(2);
 
   const handleContext = () => {
     context == 1 ? setContext(0) : setContext(1);
   }
   return(
     <View>
       <Button 
         onPress={() => {handleContext()}} 
         title = 'Avvia' 
       />
       <Text style={{borderWidth : 1}}>
         {context}
       </Text>
     </View>
   );
 }
     
 const App = () =>{
   return (
     <View>
       <But></But>
     </View>
   );
 }
 
 export default App;
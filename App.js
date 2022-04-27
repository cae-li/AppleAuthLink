import React, { useState } from 'react';
import {
  StyleSheet, View, Text,
} from 'react-native';
import auth, { firebase, FIRAuthErrorUserInfoUpdatedCredentialKey } from '@react-native-firebase/auth';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import OTPInputView from '@twotalltotems/react-native-otp-input';

export default function LandingPage() {
  const [confirm, setConfirm] = useState();
  const [prevUser, setPrevUser] = React.useState({});
  const [appleCred, setAppleCred] = React.useState({});

  let appleCredential;

  async function signInWithPhoneNumber() {
    // Save the Apple account as previousUser - to be re-authenticated later.
    const previousUser = firebase.auth().currentUser;
    setPrevUser(previousUser);

    // Delete the previous account signed into Firebase (in this case, Apple account).
    // This step is required in order to link accounts.
    firebase.auth().currentUser.delete();

    // Enter your phone number in here to be linked.
    const confirmationPhone = await auth().signInWithPhoneNumber(' // Enter your phone number here // ');

    setConfirm(confirmationPhone);
  }

  async function onAppleButtonPress() {
    // Start the sign-in request.
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    // Ensure Apple returned a user identityToken.
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identify token returned');
    }

    // Create a Firebase credential from the response.
    const { identityToken, nonce } = appleAuthRequestResponse;
    appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
    setAppleCred(appleCredential);

    const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

    // Use credentialState response to ensure the user is authenticated.
    if (credentialState === appleAuth.State.AUTHORIZED) {
      console.log('User is authenticated');
    }

    await auth().signInWithCredential(appleCredential);
    signInWithPhoneNumber();
  }

  // An OTP will be sent to your phone number entered, and this function will verify it.
  async function confirmCode(otp) {
    try {
      const otpconfirm = await confirm.confirm(otp);

      // Current user (Phone number account sign in) saved in currentU.
      const currentU = firebase.auth().currentUser;

      // Re-authenticate Apple account.
      prevUser.reauthenticateWithCredential(appleCred);

      // Link currentU (phone number account) with Apple account (with appleCredential).
      currentU.linkWithCredential(appleCred).then(() => {
        console.log('Account linking success: ', firebase.auth().currentUser);
      }, (error) => {
        console.log('Account linking error: ', error.userInfo);
        console.log('error.userInfo:', error.userInfo);
        console.log('error.userInfo[FIRAuthErrorUserInfoUpdatedCredentialKey]:', error.userInfo[FIRAuthErrorUserInfoUpdatedCredentialKey]);
      });
    } catch (error) {
      console.log('Invalid code.', error);
      throw error;
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 0.75,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    layout: {
      paddingLeft: 15,
      paddingRight: 15,
      paddingTop: 3,
      paddingBottom: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    otptop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    otptext1: {
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      color: 'black',
      paddingTop: 30,
      paddingBottom: 18,
    },
    otpview: {
      flex: 0.2,
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      placeholderTextColor: 'black',
      width: '80%',
      height: 100,
    },
    underlineStyleBase: {
      width: 30,
      height: 45,
      borderWidth: 0,
      borderBottomWidth: 1,
      borderColor: 'black',
      color: 'black',
    },
    underlineStyleHighLighted: {
      borderColor: 'black',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.layout}>
        <Text style={styles.otptext1}>
          1. Replace your phone number in the function signInWithPhoneNumber().
          {'\n'}
          {'\n'}
          2. Sign in with Apple.
        </Text>

        <AppleButton
          buttonStyle={AppleButton.Style.BLACK}
          buttonType={AppleButton.Type.SIGN_IN}
          style={{
            width: 160,
            height: 45,
          }}
          onPress={() => onAppleButtonPress()}
        />
        <Text style={styles.otptext1}>
          3. Enter the OTP code sent to your phone number.
        </Text>

        <View style={styles.otptop}>
          <OTPInputView
            pinCount={6}
            style={styles.otpview}
            codeInputFieldStyle={styles.underlineStyleBase}
            codeInputHighlightStyle={styles.underlineStyleHighLighted}
            onCodeFilled={(value) => {
              confirmCode(value);
            }}
          />
        </View>
      </View>
    </View>
  );
}

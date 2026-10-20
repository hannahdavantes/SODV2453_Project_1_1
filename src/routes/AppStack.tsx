import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';

const { Navigator, Screen } = createStackNavigator();

import Login from '../pages/Login';
import EventsMap from '../pages/EventsMap';
import EventDetails from '../pages/EventDetails';
import SelectMapPosition from '../pages/SelectMapPosition';
import EventData from '../pages/EventData';
import { AuthenticationContext, AuthenticationContextObject } from '../context/AuthenticationContext';
import { User } from '../types/User';

const headerOptions: StackNavigationOptions = {
    headerShown: true,
    headerTintColor: '#00A3FF',
    headerTitleAlign: 'center',
    headerTitleStyle: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8fa7b3' },
    headerStyle: { backgroundColor: '#F9FAFC' },
    headerBackButtonDisplayMode: 'minimal',
};

// The red X cancels the create-event workflow and returns to the map
const addEventHeaderOptions = ({ navigation }: { navigation: any }): StackNavigationOptions => ({
    ...headerOptions,
    title: 'Add event',
    headerRight: () => (
        <Pressable style={{ paddingHorizontal: 16 }} onPress={() => navigation.popTo('EventsMap')}>
            <Feather name="x" size={24} color="#FF669D" />
        </Pressable>
    ),
});

export default function Routes() {
    const [authenticatedUser, setAuthenticatedUser] = useState<User>();

    const authenticationContextObj: AuthenticationContextObject = {
        value: authenticatedUser as User,
        setValue: setAuthenticatedUser,
    };

    return (
        <AuthenticationContext.Provider value={authenticationContextObj}>
            <NavigationContainer>
                <Navigator
                    screenOptions={{
                        headerShown: false,
                        cardStyle: { backgroundColor: '#F2F3F5' },
                    }}
                >
                    <Screen name="Login" component={Login} />

                    <Screen name="EventsMap" component={EventsMap} />

                    <Screen
                        name="EventDetails"
                        component={EventDetails}
                        options={{ ...headerOptions, title: 'Event' }}
                    />

                    <Screen
                        name="SelectMapPosition"
                        component={SelectMapPosition}
                        options={addEventHeaderOptions}
                    />

                    <Screen name="EventData" component={EventData} options={addEventHeaderOptions} />
                </Navigator>
            </NavigationContainer>
        </AuthenticationContext.Provider>
    );
}

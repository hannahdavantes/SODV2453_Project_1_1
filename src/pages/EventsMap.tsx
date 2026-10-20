import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import * as Location from 'expo-location';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import MapView, { LatLng, Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import customMapStyle from '../../map-style.json';
import * as MapSettings from '../constants/MapSettings';
import { AuthenticationContext } from '../context/AuthenticationContext';
import mapMarkerBlueImg from '../images/map-marker-blue.png';
import mapMarkerGreyImg from '../images/map-marker-grey.png';
import mapMarkerImg from '../images/map-marker.png';
import { getEventsFromNetworkOrCache } from '../services/caching';
import { Event } from '../types/Event';
import { parseDateFieldFromJSONResponse } from '../utils';

export default function EventsMap(props: StackScreenProps<any>) {
    const { navigation } = props;
    const authenticationContext = useContext(AuthenticationContext);
    const mapViewRef = useRef<MapView>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [userLocation, setUserLocation] = useState<LatLng>();
    const [isMapReady, setIsMapReady] = useState(false);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (!isFocused) return;
        getEventsFromNetworkOrCache()
            .then((data) => {
                const allEvents: Event[] = parseDateFieldFromJSONResponse(data as [], 'dateTime');
                const now = new Date();
                setEvents(allEvents.filter((event) => event.dateTime > now));
            })
            .catch((error) => console.log(error));

        Location.requestForegroundPermissionsAsync()
            .then(({ granted }) => (granted ? Location.getCurrentPositionAsync() : null))
            .then((location) => {
                if (location) {
                    const { latitude, longitude } = location.coords;
                    setUserLocation({ latitude, longitude });
                }
            })
            .catch((error) => console.log(error));
    }, [isFocused]);

    // Re-fits whenever events are (re)loaded or the user's location arrives
    useEffect(() => {
        if (!isMapReady) return;
        const coordinates: LatLng[] = events.map(({ position }) => ({
            latitude: position.latitude,
            longitude: position.longitude,
        }));
        if (userLocation) coordinates.push(userLocation);
        if (coordinates.length === 0) return;
        mapViewRef.current?.fitToCoordinates(coordinates, { edgePadding: MapSettings.EDGE_PADDING });
    }, [isMapReady, events, userLocation]);

    const hasVolunteered = (event: Event) => event.volunteersIds.includes(authenticationContext?.value?.id ?? '');
    const volunteeredCount = events.filter(hasVolunteered).length;

    const getMarkerImage = (event: Event) => {
        if (hasVolunteered(event)) return mapMarkerBlueImg;
        if (event.volunteersIds.length >= event.volunteersNeeded) return mapMarkerGreyImg;
        return mapMarkerImg;
    };

    const handleNavigateToCreateEvent = () => {};

    const handleNavigateToEventDetails = (event: Event) => {
        navigation.navigate('EventDetails', { event: { ...event, dateTime: event.dateTime.toISOString() } });
    };

    const handleLogout = async () => {
        AsyncStorage.multiRemove(['userInfo', 'accessToken']).then(() => {
            authenticationContext?.setValue(undefined);
            navigation.navigate('Login');
        });
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapViewRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                initialRegion={MapSettings.DEFAULT_REGION}
                style={styles.mapStyle}
                customMapStyle={customMapStyle}
                showsMyLocationButton={false}
                showsUserLocation={true}
                rotateEnabled={false}
                toolbarEnabled={false}
                moveOnMarkerPress={false}
                mapPadding={MapSettings.EDGE_PADDING}
                onMapReady={() => setIsMapReady(true)}
            >
                {events.map((event) => {
                    return (
                        <Marker
                            key={event.id}
                            coordinate={{
                                latitude: event.position.latitude,
                                longitude: event.position.longitude,
                            }}
                            onPress={() => handleNavigateToEventDetails(event)}
                        >
                            <Image resizeMode="contain" style={{ width: 48, height: 54 }} source={getMarkerImage(event)} />
                        </Marker>
                    );
                })}
            </MapView>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {events.length} event(s) found · {volunteeredCount} volunteered
                </Text>
                <RectButton
                    style={[styles.smallButton, { backgroundColor: '#00A3FF' }]}
                    onPress={handleNavigateToCreateEvent}
                >
                    <Feather name="plus" size={20} color="#FFF" />
                </RectButton>
            </View>
            <RectButton
                style={[styles.logoutButton, styles.smallButton, { backgroundColor: '#4D6F80' }]}
                onPress={handleLogout}
            >
                <Feather name="log-out" size={20} color="#FFF" />
            </RectButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },

    mapStyle: {
        ...StyleSheet.absoluteFill,
    },

    logoutButton: {
        position: 'absolute',
        top: 70,
        right: 24,

        elevation: 3,
    },

    footer: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 40,

        backgroundColor: '#FFF',
        borderRadius: 16,
        height: 56,
        paddingLeft: 24,

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        elevation: 3,
    },

    footerText: {
        fontFamily: 'Nunito_700Bold',
        color: '#8fa7b3',
    },

    smallButton: {
        width: 56,
        height: 56,
        borderRadius: 16,

        justifyContent: 'center',
        alignItems: 'center',
    },
});

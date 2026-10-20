import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import MapView, { LatLng, MapPressEvent, Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import customMapStyle from '../../map-style.json';
import BigButton from '../components/BigButton';
import * as MapSettings from '../constants/MapSettings';
import mapMarkerImg from '../images/map-marker.png';

export default function SelectMapPosition({ navigation, route }: StackScreenProps<any>) {
    const initialPosition: LatLng = route.params?.initialPosition ?? MapSettings.DEFAULT_POSITION;
    const [position, setPosition] = useState<LatLng>();

    const handleMapPress = (event: MapPressEvent) => {
        setPosition(event.nativeEvent.coordinate);
    };

    const handleNext = () => {
        navigation.navigate('EventData', { position });
    };

    return (
        <View style={styles.container}>
            <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                initialRegion={{ ...initialPosition, ...MapSettings.DEFAULT_DELTA }}
                style={styles.mapStyle}
                customMapStyle={customMapStyle}
                showsUserLocation={true}
                rotateEnabled={false}
                toolbarEnabled={false}
                onPress={handleMapPress}
            >
                {position && (
                    <Marker coordinate={position}>
                        <Image resizeMode="contain" style={{ width: 48, height: 54 }} source={mapMarkerImg} />
                    </Marker>
                )}
            </MapView>

            {position && (
                <View style={styles.footer}>
                    <BigButton label="Next" color="#00A3FF" onPress={handleNext} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    mapStyle: {
        ...StyleSheet.absoluteFill,
    },

    footer: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 40,

        flexDirection: 'row',
    },
});

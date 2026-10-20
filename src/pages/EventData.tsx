import { Feather } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LatLng } from 'react-native-maps';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import BigButton from '../components/BigButton';
import { formatAMPM } from '../utils';

const DESCRIPTION_MAX_LENGTH = 300;

// Pickers open on today at 12:00 AM until a value is chosen
const getDefaultPickerDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

export default function EventData({ route }: StackScreenProps<any>) {
    const position: LatLng = route.params?.position;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [volunteersNeeded, setVolunteersNeeded] = useState('');
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState<Date>();
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>();

    // The picture becomes required once image upload is added
    const isFormValid =
        name.trim() !== '' &&
        description.trim() !== '' &&
        Number(volunteersNeeded) > 0 &&
        date !== undefined &&
        time !== undefined;

    const handlePickerConfirm = (selected: Date) => {
        if (pickerMode === 'date') setDate(selected);
        else setTime(selected);
        setPickerMode(undefined);
    };

    const handleSave = () => {};

    return (
        <KeyboardAwareScrollView contentContainerStyle={styles.container} enableOnAndroid={true}>
            <Text style={styles.label}>Event Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <View style={styles.labelRow}>
                <Text style={styles.label}>About</Text>
                <Text style={styles.hint}>{DESCRIPTION_MAX_LENGTH} characters max.</Text>
            </View>
            <TextInput
                style={[styles.input, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                maxLength={DESCRIPTION_MAX_LENGTH}
                multiline
                textAlignVertical="top"
            />

            <Text style={styles.label}>Volunteers Needed</Text>
            <TextInput
                style={styles.input}
                value={volunteersNeeded}
                onChangeText={(text) => setVolunteersNeeded(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
            />

            <Text style={styles.label}>Date and Time</Text>
            <View style={styles.row}>
                <Pressable style={[styles.input, styles.halfInput]} onPress={() => setPickerMode('date')}>
                    <Text style={styles.inputText}>
                        {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                </Pressable>
                <Pressable style={[styles.input, styles.halfInput]} onPress={() => setPickerMode('time')}>
                    <Text style={styles.inputText}>{time && formatAMPM(time).toUpperCase()}</Text>
                </Pressable>
            </View>

            <Text style={styles.label}>Picture</Text>
            <Pressable style={styles.imagePicker}>
                <Feather name="plus" size={24} color="#00A3FF" />
            </Pressable>

            <View style={styles.row}>
                <BigButton label="Save" color="#00A3FF" disabled={!isFormValid} onPress={handleSave} />
            </View>

            <DateTimePickerModal
                isVisible={pickerMode !== undefined}
                mode={pickerMode}
                date={(pickerMode === 'date' ? date : time) ?? getDefaultPickerDate()}
                minimumDate={pickerMode === 'date' ? new Date() : undefined}
                onConfirm={handlePickerConfirm}
                onCancel={() => setPickerMode(undefined)}
            />
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
    },

    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },

    label: {
        fontFamily: 'Nunito_600SemiBold',
        color: '#8fa7b3',
        marginBottom: 8,
    },

    hint: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 11,
        color: '#8fa7b3',
    },

    input: {
        backgroundColor: '#FFF',
        borderWidth: 1.4,
        borderColor: '#D3E2E5',
        borderRadius: 8,
        height: 56,
        paddingHorizontal: 16,
        marginBottom: 16,
        justifyContent: 'center',

        fontFamily: 'Nunito_600SemiBold',
        color: '#5c8599',
    },

    inputText: {
        fontFamily: 'Nunito_600SemiBold',
        color: '#5c8599',
    },

    multilineInput: {
        height: 110,
        paddingTop: 16,
    },

    row: {
        flexDirection: 'row',
        gap: 8,
    },

    halfInput: {
        flex: 1,
    },

    imagePicker: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderStyle: 'dashed',
        borderWidth: 1.4,
        borderColor: '#96D2F0',
        borderRadius: 8,
        height: 56,
        marginBottom: 24,

        justifyContent: 'center',
        alignItems: 'center',
    },
});

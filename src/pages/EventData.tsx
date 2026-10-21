import { useActionSheet } from '@expo/react-native-action-sheet';
import { Feather } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useContext, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Spinner from 'react-native-loading-spinner-overlay';
import { LatLng } from 'react-native-maps';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import 'react-native-get-random-values'; // must load before uuid
import { v4 as uuidv4 } from 'uuid';
import BigButton from '../components/BigButton';
import { AuthenticationContext } from '../context/AuthenticationContext';
import { createEvent } from '../services/api';
import { UploadedImage, uploadImage } from '../services/imageApi';
import { Event } from '../types/Event';
import { formatAMPM, formatBytes, updateDateWithNewTime } from '../utils';

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 300;
const VOLUNTEERS_MAX_DIGITS = 3; // up to 999

type Field = 'name' | 'description' | 'volunteersNeeded' | 'date' | 'time' | 'picture';

// Pickers open on today at 12:00 AM until a value is chosen
const getDefaultPickerDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

const FieldError = ({ message, style }: { message?: string; style?: StyleProp<TextStyle> }) =>
    message ? <Text style={[styles.errorText, style]}>{message}</Text> : null;

export default function EventData({ navigation, route }: StackScreenProps<any>) {
    const position: LatLng = route.params?.position;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [volunteersNeeded, setVolunteersNeeded] = useState('');
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState<Date>();
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>();
    const [image, setImage] = useState<UploadedImage>();
    const [loadingMessage, setLoadingMessage] = useState<string>();
    // Errors are only shown for fields the user has already interacted with
    const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
    const { showActionSheetWithOptions } = useActionSheet();
    const authenticationContext = useContext(AuthenticationContext);

    const dateTime = date && time ? updateDateWithNewTime(date, time) : undefined;
    const isDateTimeInPast = dateTime !== undefined && dateTime <= new Date();

    const errors: Partial<Record<Field | 'dateTime', string>> = {};
    if (!name.trim()) errors.name = 'Enter the event name.';
    else if (name.trim().length < NAME_MIN_LENGTH) errors.name = `Use at least ${NAME_MIN_LENGTH} characters.`;
    if (!description.trim()) errors.description = 'Tell volunteers what the event is about.';
    if (!volunteersNeeded) errors.volunteersNeeded = 'Enter how many volunteers you need.';
    else if (Number(volunteersNeeded) < 1) errors.volunteersNeeded = 'You need at least 1 volunteer.';
    if (!date) errors.date = 'Choose a date.';
    if (!time) errors.time = 'Choose a time.';
    if (isDateTimeInPast) errors.dateTime = 'The event must be in the future.';
    if (!image) errors.picture = 'Add a picture.';

    const isFormValid = Object.keys(errors).length === 0;

    const touch = (field: Field) => setTouched((prev) => ({ ...prev, [field]: true }));
    const visibleError = (field: Field) => (touched[field] ? errors[field] : undefined);
    const dateTimeError = visibleError('date') ?? visibleError('time') ?? errors.dateTime;

    const pickImage = async (source: 'camera' | 'library') => {
        const permission =
            source === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'Permission needed',
                `Allow access to your ${source === 'camera' ? 'camera' : 'photos'} in the device settings to add a picture.`
            );
            return;
        }

        const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, base64: true };
        const result =
            source === 'camera'
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);
        const base64 = result.assets?.[0]?.base64;
        if (result.canceled || !base64) return;

        setLoadingMessage('Uploading...');
        try {
            const response = await uploadImage(base64);
            setImage(response.data.image);
        } catch (error) {
            console.warn(error);
            Alert.alert('Upload failed', 'The picture could not be uploaded. Please try again.');
        } finally {
            setLoadingMessage(undefined);
        }
    };

    const handleAddPicture = () => {
        const options = ['Take Photo', 'Choose from Library', 'Cancel'];
        showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, async (selectedIndex) => {
            if (selectedIndex === 0) await pickImage('camera');
            else if (selectedIndex === 1) await pickImage('library');
            touch('picture');
        });
    };

    const handleRemovePicture = () => {
        setImage(undefined);
        touch('picture');
    };

    const handlePickerClose = () => {
        if (pickerMode) touch(pickerMode);
        setPickerMode(undefined);
    };

    const handlePickerConfirm = (selected: Date) => {
        if (pickerMode === 'date') setDate(selected);
        else setTime(selected);
        handlePickerClose();
    };

    const handleSave = async () => {
        if (!isFormValid || !dateTime || !image) return;

        // The chosen time may have passed while the form was open
        if (dateTime <= new Date()) {
            Alert.alert('Invalid date', 'The event date and time must be in the future.');
            return;
        }

        const event: Event = {
            id: uuidv4(),
            dateTime,
            description: description.trim(),
            imageUrl: image.url,
            name: name.trim(),
            organizerId: authenticationContext?.value?.id ?? '',
            position,
            volunteersNeeded: Number(volunteersNeeded),
            volunteersIds: [],
        };

        setLoadingMessage('Saving...');
        try {
            await createEvent(event);
            // EventsMap re-fetches events when it regains focus, so the new event shows up there
            navigation.popTo('EventsMap');
        } catch (error) {
            console.warn(error);
            Alert.alert('Save failed', 'The event could not be saved. Check your connection and try again.');
        } finally {
            setLoadingMessage(undefined);
        }
    };

    return (
        <KeyboardAwareScrollView contentContainerStyle={styles.container} enableOnAndroid={true}>
            <Text style={styles.label}>Event Name</Text>
            <TextInput
                style={[styles.input, !!visibleError('name') && styles.invalid]}
                value={name}
                onChangeText={setName}
                onBlur={() => touch('name')}
                maxLength={NAME_MAX_LENGTH}
            />
            <FieldError message={visibleError('name')} />

            <View style={styles.labelRow}>
                <Text style={styles.label}>About</Text>
                <Text style={styles.hint}>{DESCRIPTION_MAX_LENGTH} characters max.</Text>
            </View>
            <TextInput
                style={[styles.input, styles.multilineInput, !!visibleError('description') && styles.invalid]}
                value={description}
                onChangeText={setDescription}
                onBlur={() => touch('description')}
                maxLength={DESCRIPTION_MAX_LENGTH}
                multiline
                textAlignVertical="top"
            />
            <FieldError message={visibleError('description')} />

            <Text style={styles.label}>Volunteers Needed</Text>
            <TextInput
                style={[styles.input, !!visibleError('volunteersNeeded') && styles.invalid]}
                value={volunteersNeeded}
                onChangeText={(text) => setVolunteersNeeded(text.replace(/[^0-9]/g, ''))}
                onBlur={() => touch('volunteersNeeded')}
                maxLength={VOLUNTEERS_MAX_DIGITS}
                keyboardType="number-pad"
            />
            <FieldError message={visibleError('volunteersNeeded')} />

            <Text style={styles.label}>Date and Time</Text>
            <View style={styles.row}>
                <Pressable
                    style={[
                        styles.input,
                        styles.halfInput,
                        (!!visibleError('date') || isDateTimeInPast) && styles.invalid,
                    ]}
                    onPress={() => setPickerMode('date')}
                >
                    <Text style={styles.inputText}>
                        {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                </Pressable>
                <Pressable
                    style={[
                        styles.input,
                        styles.halfInput,
                        (!!visibleError('time') || isDateTimeInPast) && styles.invalid,
                    ]}
                    onPress={() => setPickerMode('time')}
                >
                    <Text style={styles.inputText}>{time && formatAMPM(time).toUpperCase()}</Text>
                </Pressable>
            </View>
            <FieldError message={dateTimeError} />

            <Text style={styles.label}>Picture</Text>
            {image ? (
                <View style={styles.imageCard}>
                    <Image source={{ uri: image.thumb.url }} style={styles.thumbnail} />
                    <View style={styles.imageInfo}>
                        <Text style={styles.inputText} numberOfLines={1}>
                            {image.filename}
                        </Text>
                        <Text style={styles.hint}>{formatBytes(image.size, 0)}</Text>
                    </View>
                    <Pressable onPress={handleRemovePicture} hitSlop={8}>
                        <Feather name="x" size={24} color="#FF669D" />
                    </Pressable>
                </View>
            ) : (
                <Pressable
                    style={[styles.imagePicker, !!visibleError('picture') && styles.invalid]}
                    onPress={handleAddPicture}
                >
                    <Feather name="plus" size={24} color="#00A3FF" />
                </Pressable>
            )}
            <FieldError message={visibleError('picture')} style={styles.pictureError} />

            <View style={styles.row}>
                <BigButton label="Save" color="#00A3FF" disabled={!isFormValid} onPress={handleSave} />
            </View>

            <DateTimePickerModal
                isVisible={pickerMode !== undefined}
                mode={pickerMode}
                date={(pickerMode === 'date' ? date : time) ?? getDefaultPickerDate()}
                minimumDate={pickerMode === 'date' ? new Date() : undefined}
                onConfirm={handlePickerConfirm}
                onCancel={handlePickerClose}
            />
            <Spinner
                visible={loadingMessage !== undefined}
                textContent={loadingMessage}
                overlayColor="#031A62BF"
                textStyle={styles.spinnerText}
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

    invalid: {
        borderColor: '#FF669D',
    },

    errorText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 12,
        color: '#FF669D',
        marginTop: -8,
        marginBottom: 16,
    },

    // The picture box has a larger bottom margin than the other inputs
    pictureError: {
        marginTop: -16,
        marginBottom: 24,
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

    imageCard: {
        backgroundColor: '#E6F7FB',
        borderWidth: 1.4,
        borderColor: '#96D2F0',
        borderRadius: 8,
        padding: 8,
        paddingRight: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    thumbnail: {
        width: 56,
        height: 56,
        borderRadius: 4,
    },

    imageInfo: {
        flex: 1,
        gap: 2,
    },

    spinnerText: {
        fontFamily: 'Nunito_800ExtraBold',
        fontSize: 16,
        color: '#fff',
    },
});

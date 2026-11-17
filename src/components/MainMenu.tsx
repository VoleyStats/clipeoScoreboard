import { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated from 'react-native-reanimated';
import { backdropIn, popIn, staggerIn } from '../motion';
import { C, F } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCloseSet: () => void;
  onNewMatch: () => void;
  onSwap: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onSettings: () => void;
}

/** Fila horizontal de iconos que se despliega sobre el botón ••• */
export function MainMenu({ visible, onClose: closeMenu, onCloseSet, onNewMatch, onSwap, onUndo, canUndo, onSettings }: Props) {
  const [confirmMatch, setConfirmMatch] = useState(false);
  const onClose = () => { setConfirmMatch(false); closeMenu(); };

  const item = (i: number, icon: IconName, label: string, onPress: () => void, tone: 'default' | 'danger' = 'default', disabled = false) => (
    <Animated.View entering={staggerIn(i)}>
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      {...({ title: label } as object)}
      style={({ pressed }) => [styles.item, tone === 'danger' && styles.danger, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={24} color={tone === 'danger' ? C.onBrand : C.text} />
    </Pressable>
    </Animated.View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Animated.View entering={backdropIn} style={styles.fill}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {confirmMatch && <Animated.Text entering={popIn} style={styles.confirm}>Toca otra vez para empezar un partido nuevo</Animated.Text>}
        <Animated.View entering={popIn} style={styles.bar} onStartShouldSetResponder={() => true}>
          {item(0, 'arrow-undo', 'Deshacer', () => { onUndo(); onClose(); }, 'default', !canUndo)}
          {item(1, 'refresh', 'Reiniciar puntos (suma 1 set al que va ganando)', () => { onCloseSet(); onClose(); })}
          {item(
            2,
            confirmMatch ? 'checkmark' : 'trash-outline',
            confirmMatch ? 'Confirmar nuevo partido' : 'Nuevo partido',
            () => (confirmMatch ? (onNewMatch(), onClose()) : setConfirmMatch(true)),
            confirmMatch ? 'danger' : 'default',
          )}
          {item(3, 'swap-horizontal', 'Cambiar lados', () => { onSwap(); onClose(); })}
          {item(4, 'settings-outline', 'Ajustes', () => { onClose(); onSettings(); })}
        </Animated.View>
      </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(7,10,18,0.45)', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 56 },
  bar: {
    flexDirection: 'row', gap: 4, padding: 6, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.line,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  item: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: C.raised },
  danger: { backgroundColor: C.danger },
  disabled: { opacity: 0.3 },
  confirm: {
    color: C.text, fontFamily: F.medium, fontSize: 13, marginBottom: 10,
    backgroundColor: C.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: 'hidden',
  },
});

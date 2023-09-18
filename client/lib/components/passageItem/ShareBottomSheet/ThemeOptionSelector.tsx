import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Ionicon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

type Props<T> = {
  icon: string;
  options: T[];
  optionIsSelected: (option: T) => boolean;
  setSelected: (selected: T) => void;
  optionToColor: (option: T, isSelected: boolean) => string;
  optionToSelectionColor: (option: T, isSelected: boolean) => string;
  selectedBackgroundColor: string;
  selectedFarBackgroundColor: string;
  invert?: () => void;
};

export const THEME_OPTION_SIZE = 40;

const ThemeOptionSelector = <T,>(props: Props<T>) => {
  const {
    icon,
    options,
    optionIsSelected,
    setSelected,
    optionToColor,
    optionToSelectionColor,
    selectedBackgroundColor,
    selectedFarBackgroundColor,
    invert,
  } = props;

  return (
    <View style={styles.selector}>
      <MaterialIcon
        name={icon}
        size={THEME_OPTION_SIZE}
        color="black"
        style={styles.selectorIcon}
      />
      <View style={styles.themeOptions}>
        {[
          ...options.map((option, index) => {
            const isSelected = optionIsSelected(option);
            const color = optionToColor(option, isSelected);
            const selectionColor = optionToSelectionColor(option, isSelected);

            return (
              <TouchableOpacity
                style={{
                  ...styles.themeOption,
                  backgroundColor: color,
                  borderColor: selectionColor,
                }}
                key={index}
                onPress={() => {
                  setSelected(option);
                }}>
                {isSelected && (
                  <View
                    style={{
                      ...styles.selectedIndicator,
                      backgroundColor: selectionColor,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          }),
          invert ? (
            <View style={styles.invertIconContainer} key="invert">
              <View
                style={{
                  ...styles.invertIcon,
                  backgroundColor: selectedBackgroundColor,
                }}>
                <TouchableOpacity
                  onPress={() => {
                    invert();
                  }}>
                  <Ionicon
                    name="invert-mode"
                    size={THEME_OPTION_SIZE}
                    color={selectedFarBackgroundColor}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null,
        ]}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeOptions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderColor: 'gray',
  },
  selectorIcon: {
    flex: 0,
  },
  themeOption: {
    flewGrow: 1,
    marginLeft: 12,
    height: THEME_OPTION_SIZE,
    width: THEME_OPTION_SIZE,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  invertIconContainer: {
    height: '100%',
    marginLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#00000040',
  },
  invertIcon: {
    marginLeft: 12,
    borderRadius: THEME_OPTION_SIZE / 2,
  },
  selectedIndicator: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: 'white', // or another contrasting color
  },
});

export default ThemeOptionSelector;

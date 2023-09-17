import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {View, Text, LayoutChangeEvent, StyleSheet} from 'react-native';
import {textStyleCommon} from './text';

interface FontSizeContextProps {
  fontSizes: number[];
  heights: Record<number, number>;
  allComputed: boolean;
}

const FontSizeContext = createContext<FontSizeContextProps | undefined>(
  undefined,
);

interface FontSizeProviderProps {
  fontSizes: number[];
  children: ReactNode;
}

export const FontSizeProvider: React.FC<FontSizeProviderProps> = (
  props: FontSizeProviderProps,
) => {
  const {fontSizes, children} = props;
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [allComputed, setAllComputed] = useState(false);

  const onLayoutHandler = (fontSize: number, event: LayoutChangeEvent) => {
    const {height} = event.nativeEvent.layout;
    setHeights(prevHeights => ({...prevHeights, [fontSize]: height}));
  };

  useEffect(() => {
    setAllComputed(Object.keys(heights).length === fontSizes.length);
  }, [heights]);

  return (
    <FontSizeContext.Provider value={{fontSizes, heights, allComputed}}>
      <View style={styles.hidden}>
        {fontSizes.map(size => (
          <Text
            key={size}
            onLayout={event => onLayoutHandler(size, event)}
            style={{...textStyleCommon, fontSize: size}}>
            Sample Text
          </Text>
        ))}
      </View>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = (): FontSizeContextProps => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    opacity: 0,
  },
});

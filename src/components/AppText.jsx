import React from 'react';
import { Text, StyleSheet } from 'react-native';

const FONT_WEIGHT_MAP = {
  '300': 'Gilroy-Light',
  '400': 'Gilroy-Regular',
  'normal': 'Gilroy-Regular',
  '500': 'Gilroy-Medium',
  '600': 'Gilroy-Medium',
  '700': 'Gilroy-Bold',
  'bold': 'Gilroy-Bold',
  '800': 'Gilroy-Heavy',
  '900': 'Gilroy-Heavy',
};

export function AppText(props) {
  const { style, ...rest } = props;
  
  const flatStyle = StyleSheet.flatten(style) || {};
  let fontFamily = flatStyle.fontFamily || 'Gilroy-Regular';
  let fontWeight = flatStyle.fontWeight;
  
  if (!flatStyle.fontFamily && fontWeight) {
     fontFamily = FONT_WEIGHT_MAP[fontWeight.toString()] || 'Gilroy-Regular';
  }

  // Remove fontWeight so it doesn't conflict with custom font metadata
  const { fontWeight: _fontWeight, ...cleanStyle } = flatStyle;

  return <Text style={[cleanStyle, { fontFamily }]} {...rest} />;
}

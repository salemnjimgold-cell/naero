import React from 'react';
import PreviewStateScreen from '../components/PreviewStateScreen';

export default function SafetyScreen({ navigation }) {
  return <PreviewStateScreen navigation={navigation} icon="shield-checkmark-outline" title="Safety information" body="Current local safety information is not yet available from a reviewed production source. For an emergency, use your local official emergency services." />;
}

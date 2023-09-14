import React, {useEffect} from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {textStyleCommon} from '../../utility/text';
import IconButton from '../common/IconButton';
import AppearingView from '../common/AppearingView';
import TextLink from 'react-native-text-link';

type Props = {
  notificationStatus: string;
};

const PendingRecommendations = (props: Props) => {
  const {notificationStatus} = props;
  const [showAdditionalContext, setShowAdditionalContext] =
    React.useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setShowAdditionalContext(true);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <AppearingView duration={500}>
        <IconButton
          text="you are connected"
          icon={
            <Icon
              name="checkmark-circle-outline"
              size={24}
              color="white"
              style={styles.connectedIcon}
            />
          }
          style={styles.connectedBadge}
        />
      </AppearingView>
      {showAdditionalContext && (
        <AppearingView duration={1000} style={styles.recommendationsContainer}>
          <Text style={{...textStyleCommon, ...styles.recommendationsText}}>
            we are computing your recommendations...
          </Text>
          {notificationStatus === 'granted' ? (
            <Text style={{...textStyleCommon, ...styles.recommendationsText}}>
              you will receive your first notification shortly
            </Text>
          ) : (
            <TextLink
              textStyle={{...textStyleCommon, ...styles.recommendationsText}}
              textLinkStyle={{...textStyleCommon, ...styles.linkText}}
              pressingLinkStyle={styles.linkText}
              links={[
                {
                  text: 'enable notifications',
                  onPress: () => Linking.openSettings(),
                },
              ]}>
              enable notifications to be notified when they are ready
            </TextLink>
          )}
        </AppearingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f7f7f7',
  },
  connectedBadge: {
    backgroundColor: '#148255',
    marginBottom: 18,
    paddingLeft: 16,
    paddingRight: 24,
  },
  connectedIcon: {
    marginRight: 8,
  },
  notificationsButton: {},
  notificationsIcon: {
    marginRight: 12,
  },
  recommendationsContainer: {
    maxWidth: '100%',
  },
  recommendationsText: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
  },
  linkText: {
    fontSize: 18,
    color: 'blue',
  },
});

export default PendingRecommendations;

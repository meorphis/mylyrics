import React from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {textStyleCommon} from '../../utility/helpers/text';
import IconButton from '../common/IconButton';
import AppearingView from '../common/AppearingView';
import TextLink from 'react-native-text-link';

type Props = {
  notificationStatus: string;
};

const PendingRecommendations = (props: Props) => {
  const {notificationStatus} = props;

  return (
    <View style={styles.container}>
      <AppearingView duration={1000}>
        <IconButton
          text="you are connected"
          icon={
            <Icon
              name="checkmark-circle-outline"
              size={36}
              color="white"
              style={styles.connectedIcon}
            />
          }
          style={styles.connectedBadge}
          textStyle={styles.connectedBadgeText}
        />
      </AppearingView>
      <AppearingView
        delay={1000}
        duration={1000}
        style={styles.recommendationsContainer}>
        <Text style={{...textStyleCommon, ...styles.recommendationsText}}>
          we are computing your recommendations...
        </Text>
        {notificationStatus === 'granted' ? (
          <Text style={{...textStyleCommon, ...styles.recommendationsText}}>
            you will receive a notification when they are ready
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
    marginBottom: 12,
    paddingLeft: 16,
    paddingRight: 24,
    height: 72,
    borderRadius: 36,
  },
  connectedBadgeText: {
    fontSize: 20,
  },
  connectedIcon: {
    marginRight: 8,
  },
  notificationsButton: {},
  notificationsIcon: {
    marginRight: 12,
  },
  recommendationsContainer: {
    maxWidth: '80%',
  },
  recommendationsText: {
    marginTop: 12,
    fontSize: 20,
    color: '#333333',
    textAlign: 'center',
  },
  linkText: {
    fontSize: 20,
    color: 'blue',
  },
});

export default PendingRecommendations;

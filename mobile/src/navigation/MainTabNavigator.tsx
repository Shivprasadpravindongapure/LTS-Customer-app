import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAppSelector } from "../hooks/redux";
import BusinessProfileScreen from "../screens/profile/BusinessProfileScreen";
import LeadsScreen from "../screens/leads/LeadsScreen";
import ReviewsScreen from "../screens/reviews/ReviewsScreen";
import PlansScreen from "../screens/plans/PlansScreen";
import AnalyticsScreen from "../screens/analytics/AnalyticsScreen";
import AdminScreen from "../screens/admin/AdminScreen";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "admin";

  return (
    <Tab.Navigator screenOptions={{ headerShadowVisible: false, tabBarActiveTintColor: "#2952e3" }}>
      <Tab.Screen name="Profile" component={BusinessProfileScreen} options={{ title: "My Business" }} />
      <Tab.Screen name="Leads" component={LeadsScreen} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Plans" component={PlansScreen} />
      {isAdmin && <Tab.Screen name="Admin" component={AdminScreen} />}
    </Tab.Navigator>
  );
}

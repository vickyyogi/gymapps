import 'package:flutter/material.dart';

import 'api.dart';
import 'screens.dart';
import 'theme.dart';

void main() => runApp(const GymApp());

class GymApp extends StatelessWidget {
  const GymApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GymApps',
      theme: miniDashTheme(),
      home: const AuthGate(),
    );
  }
}

/// Splash → login atau dashboard tergantung token tersimpan.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final api = ApiClient();
  late final Future<bool> _authed;

  @override
  void initState() {
    super.initState();
    _authed = api.readToken().then((t) => t != null);
  }

  void _onLogin() => setState(() {
        _authed = Future.value(true);
      });

  void _onLogout() => setState(() {
        _authed = Future.value(false);
      });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _authed,
      builder: (context, snap) {
        if (!snap.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        return snap.data!
            ? DashboardScreen(api: api, onLogout: _onLogout)
            : LoginScreen(api: api, onLogin: _onLogin);
      },
    );
  }
}

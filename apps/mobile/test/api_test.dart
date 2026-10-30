import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:gymapps_mobile/api.dart';

class _MemStorage implements FlutterSecureStorage {
  final Map<String, String> _ = {};
  @override
  Future<String?> read({String? key, IOSOptions? iOptions, AndroidOptions? aOptions,
          LinuxOptions? lOptions, WebOptions? webOptions, MacOsOptions? mOptions,
          WindowsOptions? wOptions}) async =>
      _[key!];
  @override
  Future<void> write({String? key, String? value, IOSOptions? iOptions,
          AndroidOptions? aOptions, LinuxOptions? lOptions, WebOptions? webOptions,
          MacOsOptions? mOptions, WindowsOptions? wOptions}) async =>
      _[key!] = value!;
  @override
  Future<void> delete({String? key, IOSOptions? iOptions, AndroidOptions? aOptions,
          LinuxOptions? lOptions, WebOptions? webOptions, MacOsOptions? mOptions,
          WindowsOptions? wOptions}) async =>
      _.remove(key!);
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  test('GET kirim Authorization: Bearer saat token ada', () async {
    late http.Request seen;
    final client = ApiClient(
      client: MockClient((req) async {
        seen = req;
        return http.Response('{}', 200);
      }),
      storage: _MemStorage(),
    );
    await client.saveToken('abc123');
    await client.get('/auth/me');
    expect(seen.headers['authorization'], 'Bearer abc123');
  });

  test('GET tanpa token tidak kirim Authorization', () async {
    late http.Request seen;
    final client = ApiClient(
      client: MockClient((req) async {
        seen = req;
        return http.Response('{}', 200);
      }),
      storage: _MemStorage(),
    );
    await client.get('/auth/me');
    expect(seen.headers.containsKey('authorization'), isFalse);
  });

  test('error HTTP lempar ApiException dengan body JSON', () async {
    final client = ApiClient(
      client: MockClient((req) async => http.Response(
          jsonEncode({
            'error': {'code': 'UNAUTHENTICATED', 'message': 'Authentication required'}
          }),
          401)),
      storage: _MemStorage(),
    );
    expect(
      () => client.get('/auth/me'),
      throwsA(isA<ApiException>()
          .having((e) => e.status, 'status', 401)
          .having((e) => e.body['error']?['code'], 'code', 'UNAUTHENTICATED')),
    );
  });
}

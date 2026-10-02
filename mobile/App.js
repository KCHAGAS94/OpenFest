import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import VendasScreen from './src/screens/VendasScreen';
import ProdutosScreen from './src/screens/ProdutosScreen';
import GestaoScreen from './src/screens/GestaoScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';
import EmBreveScreen from './src/screens/EmBreveScreen';
import AppHeader from './src/navigation/AppHeader';
import MenuDrawer from './src/navigation/MenuDrawer';

const TITULOS = {
  caixa: 'Caixa',
  produtos: 'Produtos',
  gestao: 'Gestão',
  configuracoes: 'Configurações',
};

// Ordem de prioridade para decidir a tela inicial conforme a permissão do usuário.
const ORDEM_TELAS = ['caixa', 'produtos', 'gestao', 'configuracoes'];

function primeiraTelaPermitida(permissoes) {
  return ORDEM_TELAS.find((tela) => permissoes?.[tela]) || null;
}

function Root() {
  const { user, loading } = useAuth();
  const [tela, setTela] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (user) setTela(primeiraTelaPermitida(user.permissoes));
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <View style={styles.container}>
      <AppHeader titulo={TITULOS[tela]} onAbrirMenu={() => setMenuAberto(true)} />

      <View style={{ flex: 1 }}>
        {tela === 'caixa' && <VendasScreen />}
        {tela === 'produtos' && <ProdutosScreen />}
        {tela === 'gestao' && <GestaoScreen />}
        {tela === 'configuracoes' && <ConfiguracoesScreen />}
        {!tela && <EmBreveScreen titulo="Sem permissões liberadas" />}
      </View>

      <MenuDrawer
        visivel={menuAberto}
        telaAtiva={tela}
        onNavegar={setTela}
        onFechar={() => setMenuAberto(false)}
      />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
      <StatusBar style="light" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#030712' },
});

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebaseconfig";
import {
  Ruler,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  FileText,
  Package,
  Map,
  CheckSquare,
} from "lucide-react";
import { medicaoService } from "../../../services/medicaoService";
import { contratoService } from "../../../services/contratoService";
import { vagaoService } from "../../../services/vagaoService";
import { itemVagaoService } from "../../../services/itemVagaoService";
import type { MedicaoDraft } from "../../../types/medicao";
import type { Contrato } from "../../../types/contratos";
import type { Vagao } from "../../../types/vagao";
import type { ItemVagao } from "../../../types/itemVagao";
import "./Medicao.css";

const STEPS = [
  { id: 1, label: "Dados Iniciais", icon: FileText },
  { id: 2, label: "Seleção de Itens", icon: Package },
  { id: 3, label: "Mapa de Unidades", icon: Map },
  { id: 4, label: "Finalização", icon: CheckSquare },
];

const MedicaoForm = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Estado do draft da medição
  const [medicaoDraft, setMedicaoDraft] = useState<MedicaoDraft>({
    numero: "",
    data: new Date().toISOString().split("T")[0],
    fornecedorId: "",
    contratoId: "",
    aditivosIds: [],
    vagaoId: "",
    itemsIds: [],
    unidades: [],
  });

  // Dados carregados
  const [fornecedores, setFornecedores] = useState<string[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [vagoes, setVagoes] = useState<Vagao[]>([]);
  const [itensDisponiveis, setItensDisponiveis] = useState<ItemVagao[]>([]);
  const [obra, setObra] = useState<{ numeroPavimentos: number } | null>(null);

  // Verificar se há alterações não salvas
  const hasUnsavedChanges = useMemo(() => {
    return (
      medicaoDraft.numero !== "" ||
      medicaoDraft.fornecedorId !== "" ||
      medicaoDraft.contratoId !== "" ||
      medicaoDraft.vagaoId !== "" ||
      medicaoDraft.itemsIds.length > 0 ||
      medicaoDraft.unidades.length > 0
    );
  }, [medicaoDraft]);

  // Bloquear navegação se houver alterações não salvas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      if (!obraId) return;

      try {
        setLoading(true);
        const [vagoesData, itensData] = await Promise.all([
          vagaoService.getVagoesByObra(obraId),
          itemVagaoService.getItensByObra(obraId),
        ]);

        setVagoes(vagoesData);

        // Extrair fornecedores únicos dos itens
        const fornecedoresSet = new Set<string>();
        itensData.forEach((item) => {
          if (item.empresa) {
            fornecedoresSet.add(item.empresa);
          }
        });
        setFornecedores(Array.from(fornecedoresSet).sort());

        // Carregar dados da obra para o mapa de unidades
        const obraDoc = await getDoc(doc(db, "obras", obraId));
        if (obraDoc.exists()) {
          setObra({ numeroPavimentos: obraDoc.data().numeroPavimentos });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [obraId]);

  // Carregar contratos quando fornecedor for selecionado
  useEffect(() => {
    const loadContratos = async () => {
      if (!obraId || !medicaoDraft.fornecedorId) {
        setContratos([]);
        return;
      }

      try {
        const contratosData = await contratoService.getContratosByFornecedor(
          obraId,
          medicaoDraft.fornecedorId
        );
        setContratos(contratosData);
      } catch (err) {
        console.error("Erro ao carregar contratos:", err);
      }
    };

    loadContratos();
  }, [obraId, medicaoDraft.fornecedorId]);

  // Carregar itens quando vagão e fornecedor forem selecionados
  useEffect(() => {
    const loadItens = async () => {
      if (!obraId || !medicaoDraft.vagaoId || !medicaoDraft.fornecedorId) {
        setItensDisponiveis([]);
        return;
      }

      try {
        const itensData = await itemVagaoService.getItensByObra(obraId);

        // Filtrar itens do vagão e do fornecedor
        const itensFiltrados = itensData.filter((item) => {
          const isVagaoMatch = item.vagaoId === medicaoDraft.vagaoId;
          const isFornecedorMatch = item.empresa === medicaoDraft.fornecedorId;
          return isVagaoMatch && isFornecedorMatch;
        });

        setItensDisponiveis(itensFiltrados);
      } catch (err) {
        console.error("Erro ao carregar itens:", err);
      }
    };

    loadItens();
  }, [obraId, medicaoDraft.vagaoId, medicaoDraft.fornecedorId]);

  // Obter aditivos do contrato selecionado
  const aditivos = useMemo(() => {
    if (!medicaoDraft.contratoId) return [];
    const contratoPrincipal = contratos.find(
      (c) => c.id === medicaoDraft.contratoId && c.tipo === "contrato"
    );
    if (!contratoPrincipal) return [];

    return contratos.filter(
      (c) =>
        c.tipo === "aditivo" &&
        c.contratoOriginalId === contratoPrincipal.id
    );
  }, [contratos, medicaoDraft.contratoId]);

  // Validações por etapa
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          medicaoDraft.numero &&
          medicaoDraft.data &&
          medicaoDraft.fornecedorId &&
          medicaoDraft.contratoId &&
          medicaoDraft.vagaoId
        );
      case 2:
        return medicaoDraft.itemsIds.length > 0;
      case 3:
        return medicaoDraft.unidades.length > 0;
      case 4:
        return validateStep(1) && validateStep(2) && validateStep(3);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      setError(null);
    } else {
      setError("Preencha todos os campos obrigatórios antes de avançar.");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSave = async () => {
    if (!obraId || !validateStep(4)) {
      setError("Preencha todos os campos obrigatórios antes de salvar.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await medicaoService.createMedicao(obraId, medicaoDraft);

      // Resetar e voltar para a lista
      setMedicaoDraft({
        numero: "",
        data: new Date().toISOString().split("T")[0],
        fornecedorId: "",
        contratoId: "",
        aditivosIds: [],
        vagaoId: "",
        itemsIds: [],
        unidades: [],
      });
      setCurrentStep(1);
      navigate(`/obras/${obraId}/medicao`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar medição");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setMedicaoDraft({
      numero: "",
      data: new Date().toISOString().split("T")[0],
      fornecedorId: "",
      contratoId: "",
      aditivosIds: [],
      vagaoId: "",
      itemsIds: [],
      unidades: [],
    });
    setCurrentStep(1);
    setShowExitConfirm(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      navigate(`/obras/${obraId}/medicao`);
    }
  };

  const handleConfirmExit = () => {
    handleDiscard();
    navigate(`/obras/${obraId}/medicao`);
  };

  // Gerar unidades do mapa baseado no vagão e obra
  const generateUnidades = useCallback(() => {
    if (!obra || !medicaoDraft.vagaoId) return [];

    const vagao = vagoes.find((v) => v.id === medicaoDraft.vagaoId);
    if (!vagao) return [];

    const unidades: string[] = [];
    const numeroPavimentos = obra.numeroPavimentos;
    const totalApartamentos = vagao.numeroApartamentos;
    const apartamentosPorAndar = Math.ceil(totalApartamentos / numeroPavimentos);

    let contador = 1;
    for (let andar = numeroPavimentos; andar >= 1; andar--) {
      for (let apt = 1; apt <= apartamentosPorAndar && contador <= totalApartamentos; apt++) {
        const numeroApt = `${andar}${apt.toString().padStart(2, "0")}`;
        unidades.push(numeroApt);
        contador++;
      }
    }

    return unidades;
  }, [obra, medicaoDraft.vagaoId, vagoes]);

  const unidadesDisponiveis = useMemo(() => generateUnidades(), [generateUnidades]);

  const toggleUnidade = (unidade: string) => {
    setMedicaoDraft((prev) => ({
      ...prev,
      unidades: prev.unidades.includes(unidade)
        ? prev.unidades.filter((u) => u !== unidade)
        : [...prev.unidades, unidade],
    }));
  };

  if (loading && !fornecedores.length) {
    return (
      <div className="medicao-loading">
        <Loader2 size={48} className="spinner-rotate" />
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="medicao-container">
      <div className="medicao-header">
        <div className="medicao-header-left">
          <Ruler size={32} />
          <div>
            <h1>Medição</h1>
            <p>Registre a execução real dos serviços realizados</p>
          </div>
        </div>
        <button className="btn-cancel" onClick={handleCancel}>
          <X size={20} />
          Cancelar
        </button>
      </div>

      {/* Stepper */}
      <div className="medicao-stepper">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div
              key={step.id}
              className={`stepper-step ${isActive ? "active" : ""} ${
                isCompleted ? "completed" : ""
              }`}
            >
              <div className="stepper-step-icon">
                {isCompleted ? (
                  <CheckCircle size={24} />
                ) : (
                  <StepIcon size={24} />
                )}
              </div>
              <div className="stepper-step-label">{step.label}</div>
              {index < STEPS.length - 1 && (
                <div className="stepper-step-connector" />
              )}
            </div>
          );
        })}
      </div>

      {/* Conteúdo da etapa */}
      <div className="medicao-content">
        {error && (
          <div className="medicao-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Etapa 1: Dados Iniciais */}
        {currentStep === 1 && (
          <div className="medicao-step-content">
            <h2>Dados Iniciais da Medição</h2>
            <div className="medicao-form-grid">
              <div className="medicao-form-group">
                <label htmlFor="numero">Número da Medição *</label>
                <input
                  id="numero"
                  type="text"
                  value={medicaoDraft.numero}
                  onChange={(e) =>
                    setMedicaoDraft((prev) => ({
                      ...prev,
                      numero: e.target.value,
                    }))
                  }
                  placeholder="Ex: MED-001"
                />
              </div>

              <div className="medicao-form-group">
                <label htmlFor="data">Data da Medição *</label>
                <input
                  id="data"
                  type="date"
                  value={medicaoDraft.data}
                  onChange={(e) =>
                    setMedicaoDraft((prev) => ({
                      ...prev,
                      data: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="medicao-form-group">
                <label htmlFor="fornecedor">Fornecedor *</label>
                <select
                  id="fornecedor"
                  value={medicaoDraft.fornecedorId}
                  onChange={(e) =>
                    setMedicaoDraft((prev) => ({
                      ...prev,
                      fornecedorId: e.target.value,
                      contratoId: "",
                      aditivosIds: [],
                    }))
                  }
                >
                  <option value="">Selecione um fornecedor</option>
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor} value={fornecedor}>
                      {fornecedor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="medicao-form-group">
                <label htmlFor="contrato">Contrato *</label>
                <select
                  id="contrato"
                  value={medicaoDraft.contratoId}
                  onChange={(e) =>
                    setMedicaoDraft((prev) => ({
                      ...prev,
                      contratoId: e.target.value,
                      aditivosIds: [],
                    }))
                  }
                  disabled={!medicaoDraft.fornecedorId}
                >
                  <option value="">Selecione um contrato</option>
                  {contratos
                    .filter((c) => c.tipo === "contrato")
                    .map((contrato) => (
                      <option key={contrato.id} value={contrato.id}>
                        {contrato.numeroContrato}
                      </option>
                    ))}
                </select>
              </div>

              {aditivos.length > 0 && (
                <div className="medicao-form-group medicao-form-group-full">
                  <label>Aditivos</label>
                  <div className="medicao-checkboxes">
                    {aditivos.map((aditivo) => (
                      <label key={aditivo.id} className="medicao-checkbox">
                        <input
                          type="checkbox"
                          checked={medicaoDraft.aditivosIds.includes(aditivo.id)}
                          onChange={(e) =>
                            setMedicaoDraft((prev) => ({
                              ...prev,
                              aditivosIds: e.target.checked
                                ? [...prev.aditivosIds, aditivo.id]
                                : prev.aditivosIds.filter((id) => id !== aditivo.id),
                            }))
                          }
                        />
                        <span>{aditivo.numeroContrato}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="medicao-form-group">
                <label htmlFor="vagao">Vagão *</label>
                <select
                  id="vagao"
                  value={medicaoDraft.vagaoId}
                  onChange={(e) =>
                    setMedicaoDraft((prev) => ({
                      ...prev,
                      vagaoId: e.target.value,
                      itemsIds: [],
                      unidades: [],
                    }))
                  }
                >
                  <option value="">Selecione um vagão</option>
                  {vagoes.map((vagao) => (
                    <option key={vagao.id} value={vagao.id}>
                      Vagão {vagao.numero}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Etapa 2: Seleção de Itens */}
        {currentStep === 2 && (
          <div className="medicao-step-content">
            <h2>Seleção de Itens da Medição</h2>
            {itensDisponiveis.length === 0 ? (
              <div className="medicao-empty-state">
                <Package size={48} />
                <p>Nenhum item disponível para este vagão e contrato.</p>
              </div>
            ) : (
              <div className="medicao-items-list">
                {itensDisponiveis.map((item) => (
                  <label key={item.id} className="medicao-item-checkbox">
                    <input
                      type="checkbox"
                      checked={medicaoDraft.itemsIds.includes(item.id)}
                      onChange={(e) =>
                        setMedicaoDraft((prev) => ({
                          ...prev,
                          itemsIds: e.target.checked
                            ? [...prev.itemsIds, item.id]
                            : prev.itemsIds.filter((id) => id !== item.id),
                        }))
                      }
                    />
                    <div className="medicao-item-info">
                      <span className="medicao-item-servico">{item.servico}</span>
                      <span className="medicao-item-empresa">{item.empresa}</span>
                      <span className="medicao-item-quantidade">
                        Quantidade: {item.quantidade}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Etapa 3: Mapa de Unidades */}
        {currentStep === 3 && (
          <div className="medicao-step-content">
            <h2>Mapa de Unidades</h2>
            <p className="medicao-subtitle">
              Marque os apartamentos que foram executados nesta medição
            </p>
            {unidadesDisponiveis.length === 0 ? (
              <div className="medicao-empty-state">
                <Map size={48} />
                <p>Selecione um vagão na etapa anterior para ver o mapa de unidades.</p>
              </div>
            ) : (
              <div className="medicao-unidades-map">
                {Array.from(
                  new Set(
                    unidadesDisponiveis.map((u) => {
                      // Extrair o andar (primeiro dígito(s))
                      const match = u.match(/^(\d+)/);
                      return match ? match[1] : u;
                    })
                  )
                )
                  .sort((a, b) => Number(b) - Number(a))
                  .map((andar) => (
                    <div key={andar} className="medicao-unidades-floor">
                      <div className="medicao-unidades-floor-label">
                        Andar {andar}
                      </div>
                      <div className="medicao-unidades-floor-apts">
                        {unidadesDisponiveis
                          .filter((u) => u.startsWith(andar))
                          .sort()
                          .map((unidade) => {
                            const isSelected = medicaoDraft.unidades.includes(unidade);
                            return (
                              <button
                                key={unidade}
                                type="button"
                                className={`medicao-unidade-btn ${
                                  isSelected ? "selected" : ""
                                }`}
                                onClick={() => toggleUnidade(unidade)}
                              >
                                {unidade}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Etapa 4: Finalização */}
        {currentStep === 4 && (
          <div className="medicao-step-content">
            <h2>Resumo da Medição</h2>
            <div className="medicao-summary">
              <div className="medicao-summary-section">
                <h3>Dados Básicos</h3>
                <div className="medicao-summary-item">
                  <span className="medicao-summary-label">Número:</span>
                  <span className="medicao-summary-value">{medicaoDraft.numero}</span>
                </div>
                <div className="medicao-summary-item">
                  <span className="medicao-summary-label">Data:</span>
                  <span className="medicao-summary-value">
                    {new Date(medicaoDraft.data).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              <div className="medicao-summary-section">
                <h3>Fornecedor e Contrato</h3>
                <div className="medicao-summary-item">
                  <span className="medicao-summary-label">Fornecedor:</span>
                  <span className="medicao-summary-value">
                    {medicaoDraft.fornecedorId}
                  </span>
                </div>
                <div className="medicao-summary-item">
                  <span className="medicao-summary-label">Contrato:</span>
                  <span className="medicao-summary-value">
                    {
                      contratos.find((c) => c.id === medicaoDraft.contratoId)
                        ?.numeroContrato
                    }
                  </span>
                </div>
                {medicaoDraft.aditivosIds.length > 0 && (
                  <div className="medicao-summary-item">
                    <span className="medicao-summary-label">Aditivos:</span>
                    <span className="medicao-summary-value">
                      {medicaoDraft.aditivosIds.length} aditivo(s)
                    </span>
                  </div>
                )}
              </div>

              <div className="medicao-summary-section">
                <h3>Vagão</h3>
                <div className="medicao-summary-item">
                  <span className="medicao-summary-label">Vagão:</span>
                  <span className="medicao-summary-value">
                    Vagão{" "}
                    {vagoes.find((v) => v.id === medicaoDraft.vagaoId)?.numero}
                  </span>
                </div>
              </div>

              <div className="medicao-summary-section">
                <h3>Itens Selecionados</h3>
                <div className="medicao-summary-item">
                  <span className="medicao-summary-label">Quantidade:</span>
                  <span className="medicao-summary-value">
                    {medicaoDraft.itemsIds.length} item(ns)
                  </span>
                </div>
                <ul className="medicao-summary-list">
                  {itensDisponiveis
                    .filter((item) => medicaoDraft.itemsIds.includes(item.id))
                    .map((item) => (
                      <li key={item.id}>
                        {item.servico} ({item.empresa})
                      </li>
                    ))}
                </ul>
              </div>

              <div className="medicao-summary-section">
                <h3>Unidades Marcadas</h3>
                <div className="medicao-summary-item">
                  <span className="medicao-summary-label">Total:</span>
                  <span className="medicao-summary-value">
                    {medicaoDraft.unidades.length} unidade(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="medicao-navigation">
        <button
          className="btn-nav btn-nav-back"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft size={20} />
          Voltar
        </button>
        <div className="medicao-navigation-steps">
          {currentStep} de {STEPS.length}
        </div>
        {currentStep < 4 ? (
          <button className="btn-nav btn-nav-next" onClick={handleNext}>
            Próximo
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            className="btn-nav btn-nav-save"
            onClick={handleSave}
            disabled={saving || !validateStep(4)}
          >
            {saving ? (
              <>
                <Loader2 size={20} className="spinner-rotate" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Gerar Medição
              </>
            )}
          </button>
        )}
      </div>

      {/* Modal de confirmação de saída */}
      {showExitConfirm && (
        <div className="medicao-modal-overlay">
          <div className="medicao-modal">
            <h3>Descartar Medição?</h3>
            <p>
              Se sair agora, perderá esta medição. Deseja continuar?
            </p>
            <div className="medicao-modal-actions">
              <button
                className="btn-modal btn-modal-cancel"
                onClick={() => setShowExitConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-modal btn-modal-confirm"
                onClick={handleConfirmExit}
              >
                Sim, descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicaoForm;

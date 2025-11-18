import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { vagaoService } from "../../../services/vagaoService";
import { itemVagaoService } from "../../../services/itemVagaoService";
import type { Vagao } from "../../../types/vagao";
import type { ItemVagao, CreateItemVagaoData } from "../../../types/itemVagao";
import {
  Building,
  Plus,
  Loader2,
  X,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  Factory,
  Layers,
} from "lucide-react";
import "./Itens.css";

const Itens = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const [vagoes, setVagoes] = useState<Vagao[]>([]);
  const [itens, setItens] = useState<ItemVagao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemVagao | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateItemVagaoData>({
    vagaoId: "",
    empresa: "",
    servico: "",
    quantidade: 0,
  });

  const loadData = useCallback(async () => {
    if (!obraId) return;

    try {
      setLoading(true);
      setError(null);
      const [vagoesData, itensData] = await Promise.all([
        vagaoService.getVagoesByObra(obraId),
        itemVagaoService.getItensByObra(obraId),
      ]);
      setVagoes(vagoesData);
      setItens(itensData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getQuantidadeAtual = (vagaoId: string) => {
    return itemVagaoService.somarQuantidadePorVagao(itens, vagaoId);
  };

  const handleOpenModal = (item?: ItemVagao) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        vagaoId: item.vagaoId,
        empresa: item.empresa,
        servico: item.servico,
        quantidade: item.quantidade,
      });
    } else {
      setEditingItem(null);
      setFormData({
        vagaoId: "",
        empresa: "",
        servico: "",
        quantidade: 0,
      });
    }
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!obraId) return;

    try {
      setSubmitting(true);
      setError(null);
      const vagao = vagoes.find((v) => v.id === formData.vagaoId);
      if (!vagao) throw new Error("Vagão não encontrado");

      const quantidadeAtual = getQuantidadeAtual(formData.vagaoId);

      if (editingItem) {
        await itemVagaoService.updateItem(
          editingItem.id,
          vagao,
          { ...formData },
          quantidadeAtual,
          editingItem.quantidade
        );
      } else {
        await itemVagaoService.createItem(
          obraId,
          vagao,
          formData,
          quantidadeAtual
        );
      }

      setShowModal(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      await itemVagaoService.deleteItem(itemId);
      await loadData();
      setMenuOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar item");
    }
  };

  const getVagaoCapacidade = (vagaoId: string) => {
    const vagao = vagoes.find((v) => v.id === vagaoId);
    if (!vagao) return { atual: 0, max: 0 };
    return {
      atual: getQuantidadeAtual(vagaoId),
      max: vagao.numeroApartamentos,
    };
  };

  return (
    <div className="itens-container">
      <div className="itens-header">
        <div className="itens-header-left">
          <h1>Itens por Vagão</h1>
          <p>Cadastre fornecedores e serviços vinculados a cada vagão</p>
        </div>
        <div className="itens-header-right">
          <button onClick={() => handleOpenModal()} className="btn-add-item">
            <Plus size={20} />
            <span>Novo Item</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="itens-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="itens-loading">
          <Loader2 size={48} className="itens-spinner" />
          <p>Carregando itens...</p>
        </div>
      ) : itens.length === 0 ? (
        <div className="itens-empty">
          <Factory size={64} />
          <h2>Nenhum item cadastrado</h2>
          <p>Comece adicionando serviços para os vagões</p>
          <button onClick={() => handleOpenModal()} className="btn-add-item">
            <Plus size={20} />
            <span>Adicionar Primeiro Item</span>
          </button>
        </div>
      ) : (
        <div className="itens-grid">
          {itens.map((item, index) => (
            <div
              className="item-card"
              key={item.id}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="item-card-header">
                <div className="item-vagao">
                  <Building size={20} />
                  <span>Vagão {item.vagaoNumero}</span>
                </div>
                <div className="item-menu">
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === item.id ? null : item.id)
                    }
                    className="item-menu-button"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {menuOpen === item.id && (
                    <div className="item-dropdown-menu">
                      <button onClick={() => handleOpenModal(item)}>
                        <Edit size={16} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="delete-action"
                      >
                        <Trash2 size={16} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="item-body">
                <div className="item-info-row">
                  <Factory size={16} />
                  <div>
                    <span className="item-label">Empresa</span>
                    <p className="item-value">{item.empresa}</p>
                  </div>
                </div>

                <div className="item-info-row">
                  <Layers size={16} />
                  <div>
                    <span className="item-label">Serviço</span>
                    <p className="item-value">{item.servico}</p>
                  </div>
                </div>

                <div className="item-progress">
                  <div className="item-progress-header">
                    <span>Quantidade</span>
                    <strong>
                      {item.quantidade} / {item.quantidadeMaxima}
                    </strong>
                  </div>
                  <div className="item-progress-bar">
                    <div
                      className={`item-progress-fill ${
                        item.quantidade === item.quantidadeMaxima
                          ? "complete"
                          : ""
                      }`}
                      style={{
                        width: `${
                          (item.quantidade / item.quantidadeMaxima) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  {item.quantidade === item.quantidadeMaxima && (
                    <span className="item-progress-status">
                      Limite do Vagão atingido
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="itens-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="itens-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="itens-modal-header">
              <h2>{editingItem ? "Editar Item" : "Novo Item"}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="itens-modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="itens-modal-form">
              <div className="itens-form-group">
                <label htmlFor="vagao">Vagão *</label>
                <select
                  id="vagao"
                  value={formData.vagaoId}
                  onChange={(e) =>
                    setFormData({ ...formData, vagaoId: e.target.value })
                  }
                  required
                  disabled={submitting || !!editingItem}
                >
                  <option value="">Selecione um vagão</option>
                  {(editingItem ? vagoes : vagoes).map((vagao) => {
                    const capacidade = getVagaoCapacidade(vagao.id);
                    const disponivel =
                      vagao.numeroApartamentos - capacidade.atual;

                    if (!editingItem && disponivel <= 0) return null;

                    return (
                      <option key={vagao.id} value={vagao.id}>
                        {`Vagão ${vagao.numero} (Disponível: ${disponivel})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="itens-form-group">
                <label htmlFor="empresa">Empresa Fornecedora*</label>
                <input
                  type="text"
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) =>
                    setFormData({ ...formData, empresa: e.target.value })
                  }
                  required
                  disabled={submitting}
                  placeholder="Ex: Construtora XYZ"
                />
              </div>

              <div className="itens-form-group">
                <label htmlFor="servico">Serviço Negociado *</label>
                <input
                  type="text"
                  id="servico"
                  value={formData.servico}
                  onChange={(e) =>
                    setFormData({ ...formData, servico: e.target.value })
                  }
                  required
                  disabled={submitting}
                  placeholder="Ex: Instalação elétrica"
                />
              </div>

              <div className="itens-form-group">
                <label htmlFor="quantidade">Quantidade *</label>
                <input
                  type="number"
                  id="quantidade"
                  min="0"
                  step="1"
                  value={formData.quantidade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantidade: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                  disabled={submitting}
                />
                {formData.vagaoId &&
                  (() => {
                    const capacidade = getVagaoCapacidade(formData.vagaoId);
                    const disponivel = capacidade.max - capacidade.atual;
                    const quantidadeEditada = editingItem
                      ? capacidade.atual -
                        editingItem.quantidade +
                        formData.quantidade
                      : capacidade.atual + formData.quantidade;

                    if (quantidadeEditada > capacidade.max) {
                      return (
                        <div className="itens-form-warning">
                          <AlertCircle size={16} />
                          <span>
                            Quantidade excede o limite! Disponível:{" "}
                            {disponivel +
                              (editingItem ? editingItem.quantidade : 0)}{" "}
                            unidades
                          </span>
                        </div>
                      );
                    }

                    if (disponivel === 0 && !editingItem) {
                      return (
                        <div className="itens-form-warning">
                          <AlertCircle size={16} />
                          <span>
                            Este vagão já atingiu sua capacidade máxima!
                          </span>
                        </div>
                      );
                    }

                    return null;
                  })()}
              </div>

              <div className="itens-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="itens-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="itens-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="itens-spinner-small" />
                      Salvando...
                    </>
                  ) : editingItem ? (
                    "Salvar Alterações"
                  ) : (
                    "Adicionar Item"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Itens;

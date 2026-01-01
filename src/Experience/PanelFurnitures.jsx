import React, { useState } from 'react';
import { Modal, Input, Form, Button } from 'antd';
import { useSelection } from "../stores/selectionStore";

const imgStyle = { width: 150 };

function PanelFurnituresModal({furnitures, title, icon}) {
  const { currentLibNodeSelection, setCurrentLibNodeSelection, setMessage } = useSelection();
  const [isModalVisible, setModalVisible] = useState(false);
  const [isOrderModalVisible, setOrderModalVisible] = useState(false);

  const [form] = Form.useForm();
  const isCart = title === "GIỎ HÀNG";

  const closeModal = () => setModalVisible(false);
  const openOrderModal = () => setOrderModalVisible(true);
  const closeOrderModal = () => setOrderModalVisible(false);

  const handleSelect = (btn) => {
    setMessage(`Đã chọn ${btn.name} ${toVN(btn.cost)}|Vui lòng đợi load file 3D`);
    setCurrentLibNodeSelection(btn);
    closeModal();
  };

  const totalCost = furnitures.reduce((sum, item) => {
    const quantity = item.quantity ?? 1;
    const costNum = typeof item.cost === 'number' ? item.cost : Number(item.cost);
    return sum + (costNum * quantity);
  }, 0);

  const modalTitle = isCart
    ? `${title} - Tổng giá trị: ${totalCost.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}`
    : title;

  const handleOrder = () => {
    closeModal();
    openOrderModal();
  };

  const onFinishOrder = (values) => {
    form.resetFields();
    setMessage(`Đặt hàng thành công đơn hàng ${totalCost}\nKhách hàng: ${values.fullName}`);
    closeOrderModal();
  };

  // ❌ BỎ NÚT MỞ MODAL - chỉ giữ nội dung
  return (
    <>
      {/* Nội dung Modal chính - trải phẳng */}
      
        <div style={{ 
          display: "grid", 
          gridTemplateColumns:'repeat(5, 1fr)',
          gap: 10, 
          maxHeight: '60vh', 
          minHeight: '40vh',
          overflowY: 'auto' 
        }}>
          {furnitures.map((btn, index) => {
            const isSelected = currentLibNodeSelection?.name === btn.name;
            const q = btn.quantity ? btn.quantity : 1;

            return (
              <Button
                key={index}
                type={isSelected ? "primary" : "default"}
                style={{
                  height: 200,
                  display: "flex",
                  flexDirection:'column',
                  alignItems: "center",
                  gap: 0,
                  justifyContent: "flex-start",
                  borderRadius: 5,
                  textAlign: "left",
                  padding: 20,
                }}
                onClick={() => handleSelect(btn)}
              >
                <img src={btn.preview} alt={btn.name} style={imgStyle} />
                <p>{btn.name}
                  <span>(x){q}</span>
                </p>
                {btn.cost && 
                  <p>{btn.cost.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    {isCart &&
                    <span>(x){q}={(btn.cost * q).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>}
                  </p>}
              </Button>
            );
          })}
        </div>
        
        {isCart &&
          <Button type="primary" style={{ marginTop: 20, width: 120, height: 30 }} onClick={handleOrder}>
            Đặt hàng ngay
          </Button>}
      

      {/* Modal đặt hàng giữ nguyên */}
      <Modal
        title="Thông tin đặt hàng"
        open={isOrderModalVisible}
        onCancel={closeOrderModal}
        onOk={() => form.submit()}
        okText="OK"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" name="orderForm" onFinish={onFinishOrder}>
          {/* Form fields giữ nguyên */}
          <Form.Item label="Họ tên" name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input />
          </Form.Item>
          {/* ... rest form fields */}
        </Form>
      </Modal>
    </>
  );
}

const toVN = (n) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export default PanelFurnituresModal;

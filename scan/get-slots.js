// copied from vuese parseTemplate.ts

module.exports = {
  parseTemplate,
};

function parseTemplate(templateAst, result, parent) {
  const slots = result || [];
  if (templateAst.type === 1) {
    if (templateAst.tag === 'slot') {
      const slot = {
        name: 'default',
        desc: '',
      }
      const nameProp = templateAst.props.find(item => item.name === 'name' && item.type === 6);
      if (nameProp && nameProp.value.type === 2 && nameProp.value.content) {
        slot.name = nameProp.value.content;
      }
      if (parent) {
        const list = parent.children
        let currentSlotIndex = 0
        for (let i = 0; i < list.length; i++) {
          let el = list[i]
          if (el === templateAst) {
            currentSlotIndex = i
            break
          }
        }

        // Find the first leading comment node as a description of the slot
        const copies = list.slice(0, currentSlotIndex).reverse()
        for (let i = 0; i < copies.length; i++) {
          let el = copies[i]
          if (el.type === 3) {
            slot.desc = el.content.trim()
            break
          }
          if (!(el.type === 2 && !el.content.trim())) break
        }
      }
      if (!slots.some(item => item.name === slot.name)) {
        slots.push(slot);
      }
    }
    for (let i = 0; i < templateAst.children.length; i++) {
      parseTemplate(templateAst.children[i], slots, templateAst)
    }
  }
  return slots;
}
